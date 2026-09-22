import os
import time
from datetime import timedelta
import redis

REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
REDIS_PORT = int(os.getenv("REDIS_PORT", "6379"))

class ResilientCache:
    """
    A caching layer that uses Redis when reachable, and falls back to an
    in-memory cache with TTL support if Redis is offline or unavailable.
    """
    def __init__(self, host: str, port: int):
        self.host = host
        self.port = port
        self._redis_client = None
        self._redis_available = False
        self._memory_store = {}
        self._expiry_store = {}
        self._init_redis()

    def _init_redis(self):
        try:
            client = redis.Redis(
                host=self.host,
                port=self.port,
                db=0,
                socket_connect_timeout=1,
                socket_timeout=1,
                decode_responses=True
            )
            client.ping()
            self._redis_client = client
            self._redis_available = True
            print("[Cache] Connected to Redis successfully.")
        except Exception:
            self._redis_client = None
            self._redis_available = False
            print("[Cache] Redis server unavailable. Falling back to resilient in-memory caching.")

    def get(self, key: str):
        if self._redis_available and self._redis_client:
            try:
                return self._redis_client.get(key)
            except Exception:
                self._redis_available = False

        # In-memory fallback
        if key in self._memory_store:
            exp = self._expiry_store.get(key)
            if exp is not None and time.time() > exp:
                self._memory_store.pop(key, None)
                self._expiry_store.pop(key, None)
                return None
            return self._memory_store.get(key)
        return None

    def set(self, key: str, value: str, ex=None):
        if self._redis_available and self._redis_client:
            try:
                return self._redis_client.set(key, value, ex=ex)
            except Exception:
                self._redis_available = False

        # In-memory fallback
        self._memory_store[key] = str(value)
        if ex:
            seconds = ex.total_seconds() if isinstance(ex, timedelta) else int(ex)
            self._expiry_store[key] = time.time() + seconds
        else:
            self._expiry_store.pop(key, None)
        return True

    def expire(self, key: str, time_delta):
        if self._redis_available and self._redis_client:
            try:
                return self._redis_client.expire(key, time_delta)
            except Exception:
                self._redis_available = False

        # In-memory fallback
        if key in self._memory_store:
            seconds = time_delta.total_seconds() if isinstance(time_delta, timedelta) else int(time_delta)
            self._expiry_store[key] = time.time() + seconds
            return True
        return False

    def delete(self, key: str):
        if self._redis_available and self._redis_client:
            try:
                return self._redis_client.delete(key)
            except Exception:
                self._redis_available = False

        self._memory_store.pop(key, None)
        self._expiry_store.pop(key, None)
        return True

cache = ResilientCache(host=REDIS_HOST, port=REDIS_PORT)