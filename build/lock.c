// Locks the Mac immediately, like Ctrl-Cmd-Q, without Accessibility permission.
// Built by build/make-lock.js during `npm run dist`; `lock --check` only verifies the call is available.
#include <dlfcn.h>
#include <stdio.h>
#include <string.h>

int main(int argc, char **argv) {
  void *login = dlopen("/System/Library/PrivateFrameworks/login.framework/Versions/Current/login", RTLD_LAZY);
  int (*lock)(void) = login ? (int (*)(void))dlsym(login, "SACLockScreenImmediate") : NULL;
  if (!lock) { fprintf(stderr, "SACLockScreenImmediate unavailable\n"); return 1; }
  if (argc > 1 && !strcmp(argv[1], "--check")) { puts("ok"); return 0; }
  return lock();
}
