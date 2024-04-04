class LRUCache:
    def __init__(self, capacity: int):
        self.cache = []
        self.capacity = capacity

    def get(self, value):
        if value in self.cache:
            self.cache.remove(value)
            self.cache.append(value)
            return value
        return None

    def put(self, value):
        if value in self.cache:
            self.cache.remove(value)
        self.cache.append(value)
        if len(self.cache) > self.capacity:
            self.cache.pop(0)

    def search(
        self,
        query: str,
        threshold: float = 0.5,
        size_threshold_overlap: int = 5,
        threshold_overlap: float = 1.3,
        limit: int = 5,
    ) -> list[str]:
        results = []

        if len(query) < size_threshold_overlap:
            # NOTE For short queries, find the longest continuous substring match
            for value in self.cache:
                max_overlap = 0
                for i in range(len(value) - len(query) + 1):
                    overlap_count = sum(
                        1 for j in range(len(query)) if query[j] == value[i + j]
                    )
                    max_overlap = max(max_overlap, overlap_count)
                if max_overlap >= threshold_overlap:
                    results.append((value, max_overlap))
            results.sort(key=lambda x: x[1], reverse=True)
            results = [value for value, _ in results]
        else:
            # NOTE For longer queries, use trigrams and sort by similarity
            query_trigrams = self._get_trigrams(query)
            for value in self.cache:
                value_trigrams = self._get_trigrams(value)
                similarity = self._similarity(query_trigrams, value_trigrams)
                if similarity >= threshold:
                    results.append((value, similarity))
            results.sort(key=lambda x: x[1], reverse=True)
            results = [value for value, _ in results]

        return results[:limit]

    def _get_trigrams(self, string):
        return {string[i : i + 3] for i in range(len(string) - 2)}

    def _similarity(self, trigrams1: set, trigrams2: set):
        intersection = trigrams1.intersection(trigrams2)
        union = trigrams1.union(trigrams2)
        return len(intersection) / len(union) if union else 0


# # Example usage
# cache = LRUCache(3)
# cache.put("hello")
# cache.put("help")
# cache.put("helium")

# print(cache.search("hel", 0.2))  # Trigram similarity search
