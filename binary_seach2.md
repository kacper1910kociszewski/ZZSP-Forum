# Binary Search

## Name

**Binary Search**

---

## What is this algorithm?

Binary Search is an algorithm used to efficiently find a specific element in a **sorted array**.

Instead of checking every element one by one, Binary Search repeatedly divides the search range in half.

The basic idea is:

1. Look at the middle element.
2. Compare it with the value we are looking for.
3. If it is the value, we are done.
4. If the target is smaller, search the left half.
5. If the target is larger, search the right half.
6. Repeat until the element is found or there are no elements left.

Because the search space is divided in half every time, Binary Search has a time complexity of:

**O(log n)**

This makes it much faster than a simple linear search (**O(n)**) when working with large sorted arrays.

> **Important:** Binary Search requires the data to be sorted.

---

## Important Information

### Requirements

* The array must be **sorted**.
* The elements need to be comparable.
* The algorithm can be implemented iteratively or recursively.

### Time Complexity

| Case              | Complexity |
| ----------------- | ---------- |
| Best case         | O(1)       |
| Average case      | O(log n)   |
| Worst case        | O(log n)   |
| Space — iterative | O(1)       |
| Space — recursive | O(log n)   |

### When should you use it?

Binary Search is useful when:

* You need to find an element in a large sorted collection.
* You perform many searches on the same sorted data.
* You need better performance than checking every element sequentially.

For example, searching through **1,000,000 sorted elements** requires at most roughly **20 comparisons** with Binary Search, because:

```text
2²⁰ = 1,048,576
```

---

## Usage Example

Suppose we have this sorted array:

```text
[2, 5, 8, 12, 16, 23, 38, 45, 56]
```

We want to find the number **23**.

### Step 1

Check the middle element:

```text
[2, 5, 8, 12, 16, 23, 38, 45, 56]
                  ↑
                 16
```

23 is greater than 16, so we ignore everything to the left of 16.

### Step 2

Search the remaining part:

```text
[23, 38, 45, 56]
 ↑
23
```

We found the value.

---

## Visual Representation

```text
Sorted array:

Index:   0   1   2   3   4   5   6   7   8
        ┌───┬───┬───┬───┬───┬───┬───┬───┬───┐
Value:  │ 2 │ 5 │ 8 │12 │16 │23 │38 │45 │56 │
        └───┴───┴───┴───┴───┴───┴───┴───┴───┘
                        ↑
                      middle
                       16

Target = 23

23 > 16
        ↓

        ┌───┬───┬───┬───┐
Value:  │23 │38 │45 │56 │
        └───┴───┴───┴───┘
         ↑
       middle

23 == 23

FOUND!
```

### General visualization

```text
             Entire array
                  │
                  ▼
        ┌───────────────────┐
        │  2  5  8  12 16  │
        │ 23 38 45 56       │
        └───────────────────┘
                  │
             Check middle
                  │
            ┌─────┴─────┐
            │           │
       target < mid  target > mid
            │           │
            ▼           ▼
       Search left   Search right
            │           │
            └─────┬─────┘
                  │
                  ▼
             Repeat until
             found / absent
```

---

## Example Usage in C++

```cpp
#include <iostream>
#include <vector>

using namespace std;

int binarySearch(const vector<int>& arr, int target)
{
    int left = 0;
    int right = arr.size() - 1;

    while (left <= right)
    {
        int middle = left + (right - left) / 2;

        if (arr[middle] == target)
        {
            return middle;
        }

        if (arr[middle] < target)
        {
            left = middle + 1;
        }
        else
        {
            right = middle - 1;
        }
    }

    return -1;
}

int main()
{
    vector<int> numbers = {
        2, 5, 8, 12, 16, 23, 38, 45, 56
    };

    int target = 23;

    int result = binarySearch(numbers, target);

    if (result != -1)
    {
        cout << "Element found at index: "
             << result << endl;
    }
    else
    {
        cout << "Element not found." << endl;
    }

    return 0;
}
```

### Output

```text
Element found at index: 5
```

---

## Summary

**Binary Search** is an efficient searching algorithm for **sorted data**.

Its main advantage is that it eliminates half of the remaining search space after every comparison.

```text
Linear Search:  O(n)
Binary Search: O(log n)
```

The most important thing to remember is:

> **Binary Search works correctly only when the data is sorted.**
