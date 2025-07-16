<div align="center">
    <img src="/assets/site-assets/icon-upscaled.png" style="height: 6em">
    <h1>Dima News Network</h1>
</div>

## What is it?
The Dima News Network is a "news" website that was made to practise HTML, CSS and a bit of JavaScript. By [@RubyPlayzz](https://github.com/RubyPlayzz/) and [@nisiosh](https://github.com/nisiosh).

## Creating Articles
To create an article, first go into the `_posts` folder and create a new file.

### File structure
Articles are sorted by date. The filename of an article should be  
`YEAR`-`MONTH`-`DAY`-`TITLE` `.html`
That means if you wanted to create an article named "My Article" on the 15th of July 2025, you would name the file:  
`2025-7-15-my-article.html`.

Markdown is also supported (`.md`)

### Writing the file
Add the follwing (called "front matter") to the top of the article and fill out each section:
```yaml
---
title: ""
title_short: ""
author: ""
article_tags:
    - ["", ""]
cover_image: ""
layout: "article"
---
```
| Property Name | Description | Example |
|---------------|-------------|---------|
| `title` | The full title of the article. | Crazy Stuff happened today in the real world, people shocked. |
| `title_short` | A shorter title that appears on the home page and browser window. | Crazy Stuff Happened Today |
| `author` | Who wrote the article. This is usually displayed as "By `author`" across the website | Me |
| `article_tags` | See [Adding tags](#adding-tags) | `["SHOCKING", "yellow"]  -["Wowzers", "red"]` |
| `cover_image` | The filename of an image inside of `/assets/cover-images/` that is displayed on the article inside of the home page. You do not need a file path. |
| `layout`| Adds the table of contents and appropriate styling, do not change this. | |

You can then write your HTML below. You do not need any `<!DOCTYPE html>`, `<head>`, or `<body>` tags.
If you want to add css to your article, either do it by adding inline css, or add rules to `/css/styles.css`

### Adding tags
Tags are coloured boxes with text that appear below the titles of articles.
<br>
<div align="center">
    <img src="/assets/site-assets/tags-for-readme.png" alt="A screenshot of every tag colour" style="height: 3em;">
</div>
<br>

To add tags, you need to add the following to your front matter:
```yaml
article_tags:
    - ["tag_name", "tag_colour"]
```
`tag_name` is the text that will appear inside of your tag.
`tag_colour` can be one of the following colours:
| `tag_colour` | Preview |
| ------------- | -------- |
| `red` | <img src="/assets/site-assets/tags-preview/red.png" style="height: 3em;">  |
| `orange` | <img src="/assets/site-assets/tags-preview/orange.png" style="height: 3em;"> |
| `yellow` | <img src="/assets/site-assets/tags-preview/yellow.png" style="height: 3em;"> |
| `green` | <img src="/assets/site-assets/tags-preview/green.png" style="height: 3em;"> |
| `light-blue` | <img src="/assets/site-assets/tags-preview/light-blue.png" style="height: 3em;"> |
| `blue` | <img src="/assets/site-assets/tags-preview/blue.png" style="height: 3em;"> |
| `purple` | <img src="/assets/site-assets/tags-preview/purple.png" style="height: 3em;"> |
| `pink` | <img src="/assets/site-assets/tags-preview/pink.png" style="height: 3em;"> | 

You can also use HEX codes to specify specific colours.   
> [!TIP]
> To easily get HEX codes, search up "Color Picker" on Google, pick your colour, then copy the HEX section.

There are also 4 special tags:
* `rainbow`
* `gold`
* `dnn`
* `young`

You can also define custom tags in in `/css/article-tag-colors.css`.  
The format for defining tags is
```css
.tag-[tag-colour] {
    /* Whatever styling */
} 
```
## Adding Images
Adding images is kind of strange  
To add images in an article, you need to set the `src` attribute to the following format:
```html
{{ "PATH_TO_FILE" | absolute_url }}
```
so 
`/images/my-image.png`
becomes
```html
<img src={{ "images/my-image.png" | absolute_url }}>
```

<hr>
<div align="center">
    <img src="/assets/site-assets/icon-upscaled.png" style="height: 6em">
</div>
