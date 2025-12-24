<script module>
    export interface Tag {
        name: string;
        color: string;
    }
</script>

<script lang="ts">
    interface ArticleProps {
        title: string;
        tags: Tag[];
        author: string;
        date: string
    }

    const { title, tags, author, date }: ArticleProps = $props();
</script>

<h1 class="article-title">{ title }</h1>
<div class="article-card-tags">
    <!-- {% include article-tags.html article-tags=page.article_tags %} -->
    {#each tags as tag}
        <span class="tag-{tag.color.toLowerCase()}">
            {tag.name}
        </span>
    {/each}
</div>

<div class="article-info">
    <p class="article-info-item">{date}</p>
    <p class="article-info-item">By {author}</p>
</div>

<hr>