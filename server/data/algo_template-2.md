---
difficulty: ["Easy"]
languages: ["C++"]
exams: ["INF-03", "INF-04"]
---

# Binary Search — what is it
Binary search finds the position of a value inside a **sorted** array in `O(log n)` time.
It splits the search interval in half every step and drops the side that cannot hold the target.

## How it works (important)
- The array **must be sorted** before searching.
- Compare the target with the middle element.
- If equal, return that index.
- If the target is smaller, search the left half; otherwise the right half.
- Complexity: `O(log n)` time, `O(1)` space (iterative).

## Visual representation
Three pointers move toward the answer:

array = [1, 3, 5, 7, 9, 11, 13],   target = 7
lo = 0, hi = 6, mid = 3 -> array[3] = 7 == target  => found at index 3

## Example usage in C++
```cpp
#include <vector>
using namespace std;

int binarySearch(vector<int>& a, int target) {
    int lo = 0, hi = (int)a.size() - 1;
    while (lo <= hi) {
        int mid = lo + (hi - lo) / 2;
        if (a[mid] == target) return mid;
        if (a[mid] < target) lo = mid + 1;
        else hi = mid - 1;
    }
    return -1;
}
```
