# leetcode-fetch

A small CLI to fetch leetcode problems to work on them locally.


You can either get the daily problem or pass in a url of the form
and it will write the necessary info to a file for you to work on.

## Usage

First make sure you have node available on your system.
Then install the package:

```bash

npm install -g leetcode-fetch

# to get the daily problem
leetcode-fetch

# to get a specific problem
leetcode-fetch https://leetcode.com/problems/valid-anagram/

# to get a language other than python3
leetcode-fetch --lang javascript

# to make the filename the title of the problem (as opposed to the number)
leetcode-fetch https://leetcode.com/problems/number-of-provinces/ --slug

# to only get the problem name and starter code
leetcode-fetch --bare

```
