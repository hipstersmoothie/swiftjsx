// The comments sheet: comments with likes and replies, and an input bar
// docked above the keyboard (<SafeAreaInset>) with quick emoji.
import { useRef, useState } from "react";
import {
  Sheet, VStack, HStack, LazyVStack, ScrollView, SafeAreaInset, Text, TextField, Button, Image, Divider, Spacer, ContentUnavailable,
  haptic, useNow, format, type HostInstance,
} from "swiftjsx";
import { ME, postComments, type Comment, type Post } from "./data";
import { useSocial, useUI } from "./store";
import { Avatar, RichText, brandBlue } from "./ui";

export function CommentsSheet() {
  const post = useUI((s) => s.commentsFor);
  const close = useUI((s) => s.closeComments);
  return (
    <Sheet item={post} onDismiss={close} detents={["medium", "large"]} dragIndicator="visible">
      {(p) => <Comments post={p} />}
    </Sheet>
  );
}

const EMOJI = ["❤️", "🙌", "🔥", "👏", "😢", "😍", "😮", "😂"];
const NONE: Comment[] = [];

function Comments({ post }: { post: Post }) {
  const mine = useSocial((s) => s.comments[post.id]) ?? NONE;
  const addComment = useSocial((s) => s.addComment);
  // Yours (newest first) above everyone else's.
  const comments = [...mine.slice().reverse(), ...postComments(post).reverse()];
  const [text, setText] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const input = useRef<HostInstance>(null);
  const scroller = useRef<HostInstance>(null);
  const canPost = text.trim() !== "";

  const send = () => {
    if (!canPost) return;
    addComment(post.id, text.trim());
    setText("");
    setReplyTo(null);
    haptic("light");
    scroller.current?.scrollTo("top");
  };
  const reply = (author: string) => {
    setReplyTo(author);
    setText(`@${author} `);
    input.current?.focus();
  };

  return (
    <VStack spacing={0} frame={{ maxWidth: "infinity", maxHeight: "infinity" }} accessibilityIdentifier="comments-sheet" accessibilityElement="contain">
      <Text font="headline" padding={{ top: 20, bottom: 12 }}>Comments</Text>
      <Divider />
      <ScrollView ref={scroller} frame={{ maxWidth: "infinity", maxHeight: "infinity" }} onTapGesture={() => input.current?.blur()}>
        {comments.length === 0 ? (
          <ContentUnavailable systemImage="bubble.left.and.bubble.right" title="No comments yet" description="Start the conversation." padding={{ top: 40 }} />
        ) : (
          <LazyVStack alignment="leading" spacing={20} padding={{ horizontal: 16, vertical: 16 }}>
            {comments.map((comment) => (
              <CommentRow key={comment.id} comment={comment} isAuthor={comment.author === post.author} onReply={() => reply(comment.author)} />
            ))}
          </LazyVStack>
        )}
        <SafeAreaInset edge="bottom">
          <VStack spacing={0} background="bar">
            <Divider />
            {replyTo ? (
              <HStack padding={{ horizontal: 16, vertical: 8 }} background="secondarySystemBackground">
                <Text font="footnote" foregroundStyle="secondary">Replying to {replyTo}</Text>
                <Spacer />
                <Button
                  buttonStyle="plain"
                  onPress={() => {
                    setReplyTo(null);
                    setText("");
                  }}
                  accessibilityLabel="Cancel reply"
                >
                  <Image systemName="xmark" font="footnote" foregroundStyle="secondary" />
                </Button>
              </HStack>
            ) : null}
            <HStack spacing={0} padding={{ horizontal: 8, top: 8 }}>
              {EMOJI.map((emoji) => (
                <Button key={emoji} buttonStyle="plain" pressedScale={1.3} onPress={() => setText((t) => t + emoji)} frame={{ maxWidth: "infinity" }}>
                  <Text font="title2">{emoji}</Text>
                </Button>
              ))}
            </HStack>
            <HStack spacing={10} padding={{ horizontal: 12, vertical: 8 }}>
              <Avatar user={ME} size={36} />
              <HStack spacing={8} padding={{ leading: 14, trailing: 6, vertical: 4 }} border={{ color: "separator", width: 1 }} cornerRadius="capsule">
                <TextField
                  ref={input}
                  value={text}
                  onChange={setText}
                  placeholder={`Add a comment for ${post.author}…`}
                  textFieldStyle="plain"
                  submitLabel="send"
                  onSubmit={send}
                  padding={{ vertical: 6 }}
                  accessibilityIdentifier="comment-input"
                />
                <Button onPress={send} disabled={!canPost} accessibilityLabel="Post comment" accessibilityIdentifier="post-comment">
                  <Image systemName="arrow.up.circle.fill" font="title" foregroundStyle={canPost ? brandBlue : "systemGray3"} />
                </Button>
              </HStack>
            </HStack>
          </VStack>
        </SafeAreaInset>
      </ScrollView>
    </VStack>
  );
}

function CommentRow({ comment, isAuthor, onReply }: { comment: Comment; isAuthor: boolean; onReply(): void }) {
  const liked = useSocial((s) => !!s.commentLikes[comment.id]);
  const toggle = useSocial((s) => s.toggleCommentLike);
  const now = useNow();
  const likes = comment.likes + (liked ? 1 : 0);
  const like = () => {
    toggle(comment.id);
    if (!liked) haptic("light");
  };
  return (
    <HStack alignment="top" spacing={12} onDoubleTap={liked ? undefined : like} accessibilityIdentifier="comment" accessibilityElement="contain">
      <Avatar user={comment.author} size={36} />
      <VStack alignment="leading" spacing={4}>
        <HStack spacing={6}>
          <Text font="footnote" fontWeight="semibold">{comment.author === ME ? "You" : comment.author}</Text>
          {isAuthor ? <Text font="caption" foregroundStyle="secondary">· Author</Text> : null}
          <Text font="footnote" foregroundStyle="secondary">{format.relativeTime(comment.createdAt, { now, weeks: true })}</Text>
        </HStack>
        <RichText text={comment.text} font="subheadline" />
        <HStack spacing={16}>
          <Button buttonStyle="plain" onPress={onReply}>
            <Text font="caption" fontWeight="semibold" foregroundStyle="secondary">Reply</Text>
          </Button>
          {likes ? <Text font="caption" foregroundStyle="secondary">{format.count(likes, { one: "# like", other: "# likes" })}</Text> : null}
        </HStack>
      </VStack>
      <Spacer />
      <Button buttonStyle="plain" onPress={like} accessibilityLabel={liked ? "Unlike comment" : "Like comment"} padding={{ top: 4 }}>
        <Image systemName={liked ? "heart.fill" : "heart"} font="footnote" foregroundStyle={liked ? "red" : "secondary"} symbolEffect={{ type: "bounce", value: liked }} />
      </Button>
    </HStack>
  );
}
