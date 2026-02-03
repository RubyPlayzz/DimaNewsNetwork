<script lang="ts">
    import { fly } from "svelte/transition";
    import chroma from 'chroma-js';

    const tagColors = [
        ["Red", "red"],
        ["Orange", "orange"],
        ["Yellow", "yellow"],
        ["Green", "green"],
        ["Light Blue", "light-blue"],
        ["Blue", "blue"],
        ["Purple", "purple"],
        ["Pink", "pink"],
    ];
    let {
        colorPreview,
        tag = $bindable(),
        onloosefocus,
    } = $props();

    function clickOutside(node, callback) {
        const handleClick = (event) => {
            if (!node.contains(event.target)) {
                callback();
            }
        };

        document.addEventListener("click", handleClick, true);

        return {
            destroy() {
                document.removeEventListener("click", handleClick, true);
            },
        };
    }

    function GetHoverColor(tagColorName: string) {
        const styles = getComputedStyle(document.documentElement);
        let color = styles.getPropertyValue(`--tag-${tagColorName}`);

        // Convert and manipulate
        const chromaColor = chroma(color);
        const hsl = chromaColor.hsl();
        const modified = chroma.hsl(hsl[0], 0.55, 0.1);
        const hex = modified.hex();

        return hex
    }
</script>

<div 
    class="tag-customise-window"
    transition:fly={{duration: 200, y: 10}}
    use:clickOutside={() => {
        if (onloosefocus) onloosefocus();
    }}
>
    {#each tagColors as color}
        <button 
            onclick={() => tag.color = color[1]}
            style:--tag-customise-hover={GetHoverColor(color[1])}
        >
            {@render colorPreview(color[1])}
            {color[0]}
        </button>
    {/each}
</div>
