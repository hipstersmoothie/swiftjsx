// The harness reads these counters; they're only implemented by the
// instrumented layer in ../../instrumented/. With the clean, upstreamable
// layer compiled in, they report zero (and the weak mode is fixed: WeakRef).
extern "C" {
void sjsx_counts(int, long *created, long *finalized) { *created = *finalized = 0; }
long sjsx_protected_refs(void) { return 0; }
void sjsx_set_weak_mode(int) {}
long sjsx_stale_returns(void) { return 0; }
void sjsx_ref_counts(long *refs, long *weakrefs) { *refs = *weakrefs = 0; }
void sjsx_dump_ref_sites(void (*)(const char *)) {}
}
