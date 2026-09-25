<script lang="ts">
  let {
    labels = ['You', 'Them', 'You'],
    step = 1
  }: {
    labels?: string[];
    step?: 1 | 2 | 3;
  } = $props();
</script>

<ol class="thread" aria-label="Negotiation">
  {#each labels as label, i}
    <li class:done={i + 1 < step} class:now={i + 1 === step} aria-current={i + 1 === step ? 'step' : undefined}>
      <span class="dot"></span>
      {label}
    </li>
  {/each}
</ol>

<style>
  .thread {
    display: flex;
    align-items: center;
    gap: 0;
    list-style: none;
    margin: 0 0 16px;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--text-muted);
  }

  li {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    flex: 1;
  }

  li:not(:last-child)::after {
    content: '';
    flex: 1;
    height: 1px;
    margin: 0 8px;
    background: var(--border);
  }

  .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--border);
  }

  .now {
    color: var(--text-primary);
  }

  .now .dot {
    background: var(--accent);
  }

  .done {
    color: var(--text-secondary);
  }

  .done .dot {
    background: var(--text-primary);
  }

  @media (forced-colors: active) {
    li:not(:last-child)::after {
      background: CanvasText;
    }

    .dot {
      background: Canvas;
      border: 1px solid CanvasText;
    }

    .now .dot {
      background: Highlight;
      border-color: Highlight;
      outline: 1px solid CanvasText;
    }

    .done .dot {
      background: CanvasText;
    }

    .now {
      text-decoration: underline;
      text-underline-offset: 3px;
    }
  }
</style>
