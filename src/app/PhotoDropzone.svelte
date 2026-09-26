<script lang="ts">
  let {
    name = 'images',
    keepName = 'keep',
    existing = []
  }: {
    name?: string;
    keepName?: string;
    existing?: string[];
  } = $props();

  let input: HTMLInputElement | null = $state(null);
  let files = $state<File[]>([]);
  let dragging = $state(false);

  let previews = $derived(files.map((file) => ({ file, url: URL.createObjectURL(file) })));

  $effect(() => {
    const urls = previews.map((row) => row.url);
    return () => {
      for (const url of urls) URL.revokeObjectURL(url);
    };
  });

  function syncInput(next: File[]) {
    files = next;
    if (!input) return;
    const dt = new DataTransfer();
    for (const file of next) dt.items.add(file);
    input.files = dt.files;
  }

  function take(list: FileList | File[]) {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    const incoming = [...list].filter((file) => allowed.includes(file.type));
    syncInput([...files, ...incoming]);
  }

  function onDrop(event: DragEvent) {
    event.preventDefault();
    dragging = false;
    if (event.dataTransfer?.files) take(event.dataTransfer.files);
  }

  function removeAt(index: number) {
    syncInput(files.filter((_, i) => i !== index));
  }
</script>

<div class="photos">
  {#if existing.length > 0}
    <ul class="thumbs">
      {#each existing as url}
        <li>
          <img src={url} alt="" />
          <label>
            <input type="checkbox" name={keepName} value={url} checked />
            Keep
          </label>
        </li>
      {/each}
    </ul>
  {/if}

  <label
    class="drop"
    class:dragging
    ondragover={(event) => {
      event.preventDefault();
      dragging = true;
    }}
    ondragleave={() => (dragging = false)}
    ondrop={onDrop}
  >
    <input
      bind:this={input}
      id="images"
      {name}
      type="file"
      accept="image/jpeg,image/png,image/webp"
      multiple
      onchange={(event) => take((event.currentTarget as HTMLInputElement).files ?? [])}
    />
    <span class="drop-title">Drop photos here</span>
    <span class="drop-hint">or click to choose. JPG, PNG, or WebP, under 5MB.</span>
  </label>

  {#if previews.length > 0}
    <ul class="thumbs">
      {#each previews as preview, i}
        <li>
          <img src={preview.url} alt="" />
          <button type="button" class="remove" onclick={() => removeAt(i)}>Remove</button>
        </li>
      {/each}
    </ul>
  {/if}
</div>

<style>
  .drop {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;
    min-height: 132px;
    padding: 20px;
    border: 1px dashed var(--border);
    border-radius: var(--card-radius);
    background: var(--bg);
    text-align: center;
    cursor: pointer;
    transition: border-color var(--dur-fast) var(--ease-out), background var(--dur-fast) var(--ease-out);
  }

  .drop.dragging,
  .drop:hover {
    border-color: var(--text-primary);
    background: var(--bg-subtle);
  }

  .drop input {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
  }

  .drop-title {
    font-weight: 700;
  }

  .drop-hint {
    font-size: 13px;
    color: var(--text-secondary);
  }

  .thumbs {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    list-style: none;
    margin: 12px 0;
  }

  .thumbs li {
    width: 96px;
  }

  .thumbs img {
    width: 96px;
    height: 96px;
    object-fit: cover;
    border-radius: var(--card-radius);
    display: block;
    margin-bottom: 6px;
    border: 1px solid var(--border);
  }

  .thumbs label,
  .remove {
    font-size: 13px;
    display: flex;
    align-items: center;
    gap: 6px;
    background: none;
    border: none;
    color: var(--text-secondary);
    cursor: pointer;
    padding: 0;
    font-family: inherit;
  }

  .remove:hover {
    color: var(--accent);
  }

  @media (forced-colors: active) {
    .drop {
      background: Canvas;
      border: 2px dashed CanvasText;
    }

    .thumbs img {
      border: 1px solid CanvasText;
    }
  }
</style>
