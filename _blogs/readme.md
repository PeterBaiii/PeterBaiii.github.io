---
title: README
date: 2026-11-08
description: How posts on this site are written, with a tour of the Markdown features it supports.
---

This post is both an example and a reference for how this blog works. Its source is a single Markdown file,
[`_blogs/readme.md`](https://github.com/PeterBaiii/PeterBaiii.github.io/blob/main/_blogs/readme.md).

## Adding a post

Blog posts live in `_blogs/` and lecture notes in `_lecture_notes/`. A post is one Markdown file that starts with a
short header:

```yaml
---
title: README
date: 2026-11-08
description: One line shown under the title in the list (optional).
---
```

When the file is pushed, GitHub Pages builds it into a page at `/blogs/<file-name>/` and adds it to the
[Blogs](/blogs/) list, newest first. Lecture notes work the same way under `/lecture-notes/`. To keep a draft in the
repository without publishing it, add `published: false` to the header.

Images go in `assets/images/` and are referenced with an absolute path, e.g.
`![A diagram](/assets/images/diagram.png)`.

## Two languages

A post can have a Chinese version: put it in `_blogs/zh/` under the same file name. This post's
[Chinese version](/blogs/zh/readme/), for example, is `_blogs/zh/readme.md`. The two are paired automatically: each
shows a language switch next to the date, and the Blogs list shows the post once, with a link to the Chinese version.
A post can also exist in only one language; a Chinese-only post is listed under its Chinese title. Lecture notes use
`_lecture_notes/zh/` the same way.

## Math

Math is LaTeX between double dollar signs, rendered with KaTeX. Within a sentence it stays inline: the loss
$$\ell(\theta) = \|X\theta - y\|_2^2$$ is a squared norm. On lines of its own, it becomes a display equation:

$$
\mathcal{L}(\theta) = -\frac{1}{N} \sum_{i=1}^{N} \log p_\theta(y_i \mid x_i)
$$

Multi-line environments work too:

$$
\begin{aligned}
\nabla_\theta \ell(\theta) &= 2X^\top (X\theta - y) \\
\theta^\star &= (X^\top X)^{-1} X^\top y
\end{aligned}
$$

Single dollar signs are not treated as math: the Markdown step would read sequences such as `\|`, `\{` or `\\` as
escapes before KaTeX sees them, silently changing the formula.

## Code

Fenced code blocks are highlighted by language:

```python
import numpy as np

def softmax(z):
    """Numerically stable softmax."""
    e = np.exp(z - z.max())
    return e / e.sum()
```

## Other formatting

Standard Markdown works as expected: **bold**, *italic*, `inline code`, [links](https://peterbaiii.github.io/), and
lists.

| Model | Parameters |
| --- | ---: |
| GPT-2 small | 124M |
| GPT-2 medium | 355M |

> A blockquote, for quotations or asides.
