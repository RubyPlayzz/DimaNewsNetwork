<script lang="ts">
	import Cat from "./components/Cat.svelte";

	const editorVersion = "BETA.0.1";

	import { ImageDB } from "./components/scripts/imageDB";
	const images = new ImageDB();

	import DOMPurify from "dompurify";

	async function Purify(rawHTML: string) {
		const clean = DOMPurify.sanitize(rawHTML, {
			FORBID_TAGS: ["script", "style", "iframe", "object", "embed", "form", "input"],
			FORBID_ATTR: ["class", "style"],
			USE_PROFILES: { html: true },
			// ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp|blob):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
		});

		// Images \\
		const tempDiv = document.createElement("div");
    	tempDiv.innerHTML = clean;

		const imgElements = tempDiv.querySelectorAll("img[src]");

		await Promise.all(
			Array.from(imgElements).map(async (img) => {
				const src = img.getAttribute('src');
				if (src) {
					const objectURL = await images.get(src);
					if (objectURL !== undefined) {
						img.setAttribute('src', objectURL);

						return new Promise((resolve) => {
							const image = new Image();
							image.onload = resolve;
							image.onerror = resolve;
							image.src = objectURL;
                    	});
					}
				}
			})
		);


		return tempDiv.innerHTML;
	}

	interface ArticleData {
		info: {
			title: string;
			tags: Tag[];
			author: string;
		};
		content: string
	}

	let savedArticleDataRaw = localStorage.getItem("article-editor-saved-article");
	let savedArticleData: ArticleData | undefined = undefined;
	if (savedArticleDataRaw) {
		savedArticleData = JSON.parse(savedArticleDataRaw);
	}

	// Article Title Setup \\
	import ArticleTitle, { type Tag } from "./components/ArticleTitle.svelte";

	let isInitialLoad = true;

	let loadedArticleInfo = savedArticleData?.info;
	let title = $state(loadedArticleInfo?.title ?? "My Article");
	let author = $state(loadedArticleInfo?.author ?? "nisio");
	let tags: Tag[] = $state(loadedArticleInfo?.tags ?? [
		{name: "SHOCKING", color: "red"}
	]);

	$effect(() => {
		title;
		author;
		JSON.stringify(tags);

		if (isInitialLoad) {
			isInitialLoad = false;
			return;
		} else {
			saveStatus = "Saving..."
		}
		
		SaveArticle();
	});


	// Date \\
	const dateRaw = new Date();
	function GetDaySuffix(day: number) {
		if (day > 3 && day < 21) return "th";
		switch (day % 10) {
			case 1: return "st";
			case 2: return "nd";
			case 3: return "rd";
			default: return "th";
		}
	}

	const year = dateRaw.getFullYear();
	const month = dateRaw.toLocaleString("default", {
		month: "long",
	})
	const day = dateRaw.getDate().toString() + GetDaySuffix(dateRaw.getDate()) 

	let formattedDate = `${month} ${day}, ${year}`

	// Editor Setup \\
	import CodeMirror, {basicSetup, minimalSetup, html, keymap } from "./components/CodeMirror.svelte";
	import { oneDark } from "./themes/OneDark";
	import { insertTab } from "@codemirror/commands";
	import { EditorState } from "@codemirror/state";

	let saveStatus = $state(``)

	const EDITOR_PREVIEW_DELAY = 100 // How much time (in ms) until the preview updates
	const START_EDITOR_CONTENT = savedArticleData?.content ?? `<p>Hello DNN!</p>`;

	let view: any = $state(undefined);
	let content = $state(START_EDITOR_CONTENT);
	let previewPane: HTMLElement;

	let timeoutId: number | undefined = undefined;

	function handleChange(event: CustomEvent) {
		if (timeoutId) return;

		timeoutId = setTimeout(() => {
			content = event.detail.view.state.doc.toString();
			SaveArticle();
			timeoutId = undefined;
		}, EDITOR_PREVIEW_DELAY);
	}

	let contentSanitized = $state("");

	$effect(() => {
		Purify(content).then(clean => {
			contentSanitized = clean;
		});
	});

	// Edit article info \\
	let editingArticleInfo = $state(false);
	import Input from "./components/Input.svelte";

	// Export article \\
	let exporting = $state(false);

	// Upload images \\
	let files: FileList | undefined = $state();

	$effect(() => {
		if (!files) return;
		if (!view) return;

		let uploadedFile = files[0]

		// Save image \\
		images.createKey(uploadedFile).then((key) => {
			// const objectUrl = URL.createObjectURL(uploadedFile);
			// objectURLMap.set(key, objectUrl);

			images.add(key, uploadedFile).then(() => {
				// Add in editor \\
				const imageTag = `\n<img src="${key}" alt="${uploadedFile.name}">`;
				
				const cursorPos = view.state.selection.main.from;
				const line = view.state.doc.lineAt(cursorPos);
				
				const insertPos = line.to;
				const insertText = imageTag + "\n";
				
				view.dispatch({
					changes: {
						from: insertPos,
						insert: insertText
					}
				});
				content = view.state.doc.toString();
			})
		});

		// Reset \\
		files = undefined;
		const input = document.getElementById('image-upload') as HTMLInputElement;
		if (input) input.value = ''; // Reset input
	});	

	function GetExportedArticle() {
		const frontmatter = `---
title: "${title}"
title_short: "${title}"
layout: "article"
author: "${author}"
article_tags:
${tags.map((t) => `  - ["${t.name}", "${t.color}"]`).join('\n')}
cover_image: "PUT_YOUR_COVER_HERE.png"
---
`
		const contentWithFixedPaths = content.replace(
			/<img([^>]*?)src="([^"]+)"/g,
			(match, attributes, src) => {
				if (!src.startsWith('http://') && !src.startsWith('https://') && !src.startsWith('/')) {
					return `<img${attributes}src="/images/${src}"`;
				}

				return match; // Return original if it isn't an external url
			}
		);

		return frontmatter + contentWithFixedPaths;
	}

	import JSZip from 'jszip';

	async function DownloadAsZip() {
		const zip = new JSZip();
		
		const sanitizedTitle = (title || "Unnamed Article")
			.replace(/[/\\:*?"<>|]/g, '-')
			.trim();
		
		zip.file(`${sanitizedTitle}.html`, GetExportedArticle());
		
		const imagesFolder = zip.folder("images");
		
		if (imagesFolder) {
			const imgRegex = /<img\s+[^>]*src="([^"]+)"/g;
			const imageKeys = new Set<string>();
			let match;
			
			while ((match = imgRegex.exec(content)) !== null) {
				imageKeys.add(match[1]);
			}
			
			for (const key of imageKeys) {
				const blob = await images.getBlob(key);
				if (blob) {
					// Use the key as-is since it already has the extension
					imagesFolder.file(key, blob);
				}
			}
		}
		
		// Generate and download the ZIP
		const zipBlob = await zip.generateAsync({ type: 'blob' });
		const url = URL.createObjectURL(zipBlob);
		const a = document.createElement('a');
		
		a.href = url;
		a.download = `${sanitizedTitle}.zip`;
		
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	}

	function DownloadHTML(data: string, filename: string, mimeType: string) {
		const blob = new Blob([data], { type: mimeType });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');

		a.href = url;
		a.download = filename;

		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	}

	function CopyToClipboard(data: string) {
		navigator.clipboard.writeText(data);
	}

	function SaveArticle() {
		let saveArticle: ArticleData = {
			info: {
				author: author,
				title: title,
				tags: tags
			},
			content: content
		}

		localStorage.setItem("article-editor-saved-article", JSON.stringify(saveArticle));

		saveStatus = `${title} is being auto-saved.`
	}
</script>

<main>
	<div class="editor-container">
		<p class="save-text">{saveStatus}</p>
		<div class="editor-pane pane">
			<div class="header">
				<div class="left">
					<p class="header-title">HTML Editor</p>
					<a href="/articles/what-is-html" class="what-is-html" style:font-size="0.8rem" target="_blank">What is HTML?</a>
				</div>

				<div class="right">
					<label for="image-upload" class="input-button">Add Image</label>
					<input 
						style:display="none"
						id="image-upload"
						type="file" 
						title="Image"
						accept="image/*"
						bind:files
					>

					<button onclick={() => {
						editingArticleInfo = !editingArticleInfo
					}}>{editingArticleInfo ? "Edit Article" : "Edit Article Info"}</button>
				</div>
			</div>
			<CodeMirror 
				hidden={editingArticleInfo}
				doc={content} 
				extensions={[
					basicSetup, 
					oneDark, 
					html(),
					keymap.of([
						{
							key: "Tab",
							run: insertTab
						}
					])
				]}
				bind:view
				on:change={handleChange}
			/>
			
			{#if editingArticleInfo}
				<div class="article-info-edit-pane">
					<Input
						name="Title"
						bind:value={title}
					/>

					<Input
						name="Tags"
						type="tags"
						bind:value={tags}
					/>

					<Input
						name="Author"
						bind:value={author}
						spellcheck={false}
					/>

					<div class="below-text">
						<Cat />
						<p>DNN Article Editor.</p>
						<p class="secondary">Very early release. More features coming soon!</p>

						<br>
						<p class="secondary">Version {editorVersion || "Unknown :/"}</p>
					</div>
				</div>
			{/if}
		</div>
		<div class="preview-pane pane">
			<div class="header">
				<div class="left">
					<p class="header-title">Preview</p>
				</div>

				<div class="right">
				 	<button onclick={() => exporting = true}>Export</button>
					<!-- <button title="Fullscreen"> -->
					<!-- <svg fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"> -->
						<!-- <path fill="var(--fullscreen-button-color)" d="M5 6a1 1 0 0 1 1-1h2a1 1 0 0 0 0-2H6a3 3 0 0 0-3 3v2a1 1 0 0 0 2 0V6ZM5 18a1 1 0 0 0 1 1h2a1 1 0 1 1 0 2H6a3 3 0 0 1-3-3v-2a1 1 0 1 1 2 0v2ZM18 5a1 1 0 0 1 1 1v2a1 1 0 1 0 2 0V6a3 3 0 0 0-3-3h-2a1 1 0 1 0 0 2h2ZM19 18a1 1 0 0 1-1 1h-2a1 1 0 1 0 0 2h2a3 3 0 0 0 3-3v-2a1 1 0 1 0-2 0v2Z"/> -->
					<!-- </svg> -->
				<!-- </button> -->
				</div>
			</div>
			<article class="preview" bind:this={previewPane}>
				<ArticleTitle
					{title}
					{tags}
					{author}
					date={formattedDate}
				/>
				{@html contentSanitized}
			</article>
		</div>
	</div>

	<!-- Export Popup -->
	{#if exporting}
		<div class="export-popup">
			<div class="top">
				<p>Exported "{title === "" ? "Unnamed Article" : title}"</p>
				<div class="export-options">
					<button onclick={() => CopyToClipboard(GetExportedArticle())}>Copy HTML</button>
					<button 
						onclick={() => {
							const sanitizedTitle = (title || "Unnamed Article")
								.replace(/[/\\:*?"<>|]/g, '-')
								.trim();
							// Download(GetExportedArticle(), `${sanitizedTitle}.html`, "text/plain")
							DownloadAsZip()
						}}
					>Download</button>
				</div>
			</div>
			<CodeMirror 
				doc={GetExportedArticle()}
				extensions={[
					minimalSetup, 
					html(),
					oneDark,
					EditorState.readOnly.of(true)
				]}
			/>
			<button class="close-button" onclick={() => exporting = false}>Close</button>
		</div>

		<div class="export-bg"></div>
	{/if}
</main>