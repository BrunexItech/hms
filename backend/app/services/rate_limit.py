import time
from collections import defaultdict

_hits: dict[str, list[float]] = defaultdict(list)


def is_rate_limited(key: str, max_hits: int, window_seconds: int) -> bool:
    now = time.time()
    window_start = now - window_seconds
    hits = [t for t in _hits[key] if t > window_start]
    hits.append(now)
    _hits[key] = hits
    return len(hits) > max_hits
