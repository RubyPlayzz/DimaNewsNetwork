<script lang="ts">
    // Cat eyes easter egg \\
	import { Spring } from "svelte/motion";
	import { reducedMotion } from "./scripts/reducedmotion";

	let eyes: HTMLElement | undefined = $state();
	let EyeSpring = new Spring({ x: 0, y: 0}, { stiffness: 0.05, damping: 0.5 });
	let transform = $state("transform(-50%, -48%)")
	$effect(() => {
    	transform = `translate(-50%, -48%) translate(${EyeSpring.current.x}px, ${EyeSpring.current.y}px)`;
	});

	function onmousemove(e: MouseEvent) {
		if (!eyes) return;
		if (!reducedMotion) return;

		const eyesRect = eyes.getBoundingClientRect();
		const eyesCenterX = eyesRect.left + eyesRect.width / 2;
		const eyesCenterY = eyesRect.top + eyesRect.height / 2;

		const deltaX = e.clientX - eyesCenterX;
		const deltaY = e.clientY - eyesCenterY;
		
		const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
		const maxDistance = 7;
		const constrainedDistance = Math.min(distance, maxDistance);
		
		const angle = Math.atan2(deltaY, deltaX);
		const moveX = Math.cos(angle) * constrainedDistance;
		const moveY = Math.sin(angle) * constrainedDistance;

		EyeSpring.target = {
			x: moveX,
			y: moveY
		};
	}
</script>

<svelte:body {onmousemove}/>


<div class="cat-container">
    <img src="/assets/site-assets/icon.png" alt="₍^⠀⠀⠀⠀^₎" class="pixelated-img" draggable="false">
    <img 
        src="/assets/site-assets/eyes.png" 
        alt="O - O" class="pixelated-img eyes" 
        bind:this={eyes} 
        draggable="false"
        style:transform={transform}
    >
</div>

<style>
    .cat-container {
        height: 4rem;
        width: 4rem;
        position: relative;
    }

    .cat-container img {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        height: 100%;
        width: 100%;
    }

    .cat-container .eyes {
        top: 52%;
        left: 52%;
    }
</style>