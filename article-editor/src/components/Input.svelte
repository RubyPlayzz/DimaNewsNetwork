<script lang="ts">
    import { type Tag } from "./ArticleTitle.svelte";

    interface InputProps {
        name: string;
        value?: string | Tag[];
        spellcheck?: boolean;
        type?: "normal" | "tags"
    }
    let { name, value=$bindable(""), spellcheck, type="normal" }: InputProps = $props();

    import TagCustomiser from "./TagCustomiser.svelte";

    interface TagIndex {
        element: HTMLElement;
        showColorList: boolean
    }
    let tagElementRefs: HTMLElement[] = $state([]);
    let showColorList: boolean[] = $state([]);

    // Tag name \\
    function autosizeInput(input: HTMLInputElement) {
        // Create a hidden span to measure text width
        const span = document.createElement('span');
        span.style.visibility = 'hidden';
        span.style.position = 'absolute';
        span.style.whiteSpace = 'pre';
        
        // Copy font styles from input to span for accurate measurement
        const styles = window.getComputedStyle(input);
        span.style.font = styles.font;
        span.style.fontSize = styles.fontSize;
        span.style.fontFamily = styles.fontFamily;
        span.style.fontWeight = styles.fontWeight;
        span.style.letterSpacing = styles.letterSpacing;
        
        document.body.appendChild(span);
        
        const updateWidth = () => {
            span.textContent = input.value || input.placeholder || '';
            // Add a small buffer for cursor and padding
            input.style.width = `${span.offsetWidth + 8}px`;
        };
        
        // Initial sizing
        updateWidth();
        
        // Update on input
        input.addEventListener('input', updateWidth);
        
        // Cleanup
        return {
            destroy() {
                span.remove();
                input.removeEventListener('input', updateWidth);
            }
        };
    }


    import { tick } from 'svelte';
    
    async function AddNewTag() {
        if (!Array.isArray(value)) return;
        
        value.push({name: "", color: "red"})
        
        // Wait for DOM to update
        await tick();
        
        const lastIndex = tagElementRefs.length - 1;
        const lastTagElement = tagElementRefs[lastIndex];

        if (lastTagElement) {
            const input = lastTagElement.querySelector('input');
            input?.focus();
        }
    }
</script>

{#snippet colorPreview(color: string)}
    <svg viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="7.5" cy="7.5" r="7" fill="var(--tag-{color})" stroke="var(--tag-color-outline)"/>
    </svg>
{/snippet}

<div class="section">
    <label for={name}>{name}</label>
    {#if type === "normal"}
        <input bind:value={value} name={name} {spellcheck} placeholder="Type here...">
    {:else}
        <!-- Value is a Tag[] -->
        <div class="tags">
            {#each Array.isArray(value) ? value : [] as tag, i}
                <div class="article-tag" bind:this={tagElementRefs[i]}>
                    <button title="Change Color" onclick={() => {
                        // Show TagCustomiser
                        console.log("show")
                        showColorList[i] = true;
                    }}>
                        {@render colorPreview(tag.color)}
                    </button>
                    
                    <input
                        bind:value={tag.name} 
                        use:autosizeInput
                        name="Tag Name" 
                        placeholder="Tag Name..." 

                    >
                    <!-- <div contenteditable>{tag.name}</div> -->
                    <!-- Delete button -->
                    <button 
                        title="Delete" 
                        class="delete-button" 
                        onclick={() => {
                            if (!Array.isArray(value)) return;

                            value.splice(value.indexOf(tag), 1);
                        }}>
                        <svg  viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <line x1="3.88909" y1="11.6673" x2="11.6673" y2="3.88909" stroke="var(--tag-delete-button)"/>
                            <line x1="11.6673" y1="11.6673" x2="3.88909" y2="3.88908" stroke="var(--tag-delete-button)"/>
                        </svg>
                    </button>

                    {#if showColorList[i]}
                        <TagCustomiser 
                            {colorPreview}
                            onloosefocus={() => showColorList[i] = false}
                            {tag}
                        />
                    {/if}
                </div>
            {/each}
            <button class="add-tag-button" onclick={() => AddNewTag()}>
                <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path fill="var(--add-icon-color)" d="M8 0C12.4183 0 16 3.58172 16 8C16 12.4183 12.4183 16 8 16C3.58172 16 0 12.4183 0 8C0 3.58172 3.58172 0 8 0ZM8 3C7.44772 3 7 3.44772 7 4V7H4C3.44772 7 3 7.44772 3 8C3 8.55228 3.44772 9 4 9H7V12C7 12.5523 7.44772 13 8 13C8.55228 13 9 12.5523 9 12V9H12C12.5523 9 13 8.55228 13 8C13 7.44772 12.5523 7 12 7H9V4C9 3.44772 8.55228 3 8 3Z"/>
                </svg>

                Add Tag
            </button>
        </div>
    {/if}
</div>