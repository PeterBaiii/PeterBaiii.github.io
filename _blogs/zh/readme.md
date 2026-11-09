---
title: README
date: 2026-11-08
description: 本站文章的写法，以及支持的 Markdown 功能一览。
---

这篇文章既是示例，也是这个博客的使用说明。它的源文件只有一个 Markdown 文件：[`_blogs/zh/readme.md`](https://github.com/PeterBaiii/PeterBaiii.github.io/blob/main/_blogs/zh/readme.md)。

## 添加文章

博客文章放在 `_blogs/`，课程笔记放在 `_lecture_notes/`。一篇文章就是一个 Markdown 文件，开头是一小段头信息：

```yaml
---
title: README
date: 2026-11-08
description: 列表中显示在标题下方的一句话简介（可选）。
---
```

文件推送后，GitHub Pages 会把它构建成 `/blogs/<文件名>/` 下的页面，并加入 [Blogs](/blogs/) 列表，最新的排在最前。课程笔记同理，位于 `/lecture-notes/` 下。如果想把草稿放在仓库里但暂不发布，就在头信息里加上 `published: false`。

图片放在 `assets/images/`，用绝对路径引用，例如 `![示意图](/assets/images/diagram.png)`。

## 中英双语

文章可以有一个中文版：放在 `_blogs/zh/` 下，文件名与英文版相同，比如本文就是 `_blogs/zh/readme.md`。两个版本会自动配对：页面日期旁会出现语言切换，Blogs 列表中这篇文章只出现一次，并附上中文版的链接。文章也可以只有一种语言，只有中文版的文章在列表中直接显示中文标题。课程笔记用 `_lecture_notes/zh/`，规则相同。

## 公式

公式用 LaTeX 书写，放在双美元符号之间，由 KaTeX 渲染。写在句子中间时保持行内显示：损失 $$\ell(\theta) = \|X\theta - y\|_2^2$$ 是一个平方范数。单独成行时则显示为行间公式：

$$
\mathcal{L}(\theta) = -\frac{1}{N} \sum_{i=1}^{N} \log p_\theta(y_i \mid x_i)
$$

多行环境同样可用：

$$
\begin{aligned}
\nabla_\theta \ell(\theta) &= 2X^\top (X\theta - y) \\
\theta^\star &= (X^\top X)^{-1} X^\top y
\end{aligned}
$$

单美元符号不会被当作公式：Markdown 处理时会先把 `\|`、`\{`、`\\` 这类序列当作转义符，KaTeX 拿到的已经是被悄悄改动过的公式。

## 代码

围栏代码块会按语言高亮：

```python
import numpy as np

def softmax(z):
    """数值稳定的 softmax。"""
    e = np.exp(z - z.max())
    return e / e.sum()
```

## 其他格式

常用的 Markdown 写法都能正常使用：**粗体**、*斜体*、`行内代码`、[链接](https://peterbaiii.github.io/)，以及列表。

| 模型 | 参数量 |
| --- | ---: |
| GPT-2 small | 124M |
| GPT-2 medium | 355M |

> 引用块，用于引文或旁注。
