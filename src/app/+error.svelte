<script lang="ts">
  import { page } from '$app/state';

  let status = $derived(page.status);
  let serverError = $derived(status >= 500);
</script>

<section class="hero" data-hero>
  <div class="container">
    <p class="eyebrow">{status}</p>
    {#if serverError}
      <h1>Something went wrong.</h1>
      <p class="lede">Try again, or go home.</p>
    {:else if status === 404}
      <h1>Page not found.</h1>
      <p class="lede">That page does not exist. Search from the header, or go home.</p>
    {:else}
      <h1>That did not work.</h1>
      <p class="lede">{page.error?.message ?? 'Go home and try again.'}</p>
    {/if}
    <div class="actions">
      <a class="btn btn-primary" href="/">Home</a>
      {#if serverError}
        <button class="btn btn-secondary" type="button" onclick={() => location.reload()}>Try again</button>
      {/if}
    </div>
  </div>
</section>

<style>
  .hero {
    padding: clamp(48px, 10vw, 96px) 0;
    background: #000;
    color: var(--text-primary);
    min-height: 50vh;
  }

  .eyebrow {
    display: inline-block;
    margin-bottom: 14px;
    padding: 5px 12px;
    background: var(--accent);
    color: #fff;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  h1 {
    font-size: clamp(28px, 6vw, 56px);
    font-weight: 800;
    letter-spacing: -0.04em;
    color: var(--text-primary);
    max-width: 16ch;
  }

  .lede {
    margin-top: 14px;
    color: var(--text-secondary);
    font-size: 17px;
    max-width: 40ch;
  }

  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    margin-top: 28px;
  }

  .actions .btn {
    width: auto;
  }

  @media (forced-colors: active) {
    h1,
    .lede {
      color: CanvasText;
    }

    .eyebrow {
      background: Canvas;
      color: CanvasText;
      border: 1px solid CanvasText;
    }
  }
</style>
