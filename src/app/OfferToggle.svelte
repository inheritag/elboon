<script lang="ts">
  let { checked = false, name = 'offerEnabled' }: { checked?: boolean; name?: string } = $props();
  let on = $state(false);
  let primed = $state(false);
  $effect.pre(() => {
    if (primed) return;
    on = checked;
    primed = true;
  });
</script>

<label class="toggle">
  <input type="checkbox" {name} role="switch" aria-checked={on} bind:checked={on} />
  <span class="switch" class:on aria-hidden="true"></span>
  <span class="copy">
    <span class="title">Accept offers</span>
    <span class="hint">{on ? 'On. Buyers can propose a price' : 'Off. Listed price only'}</span>
  </span>
</label>

<style>
  .toggle {
    display: flex;
    align-items: center;
    gap: 12px;
    cursor: pointer;
    margin-bottom: 16px;
  }

  input {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
  }

  .switch {
    position: relative;
    width: 44px;
    height: 26px;
    flex-shrink: 0;
    border-radius: 13px;
    background: var(--bg-subtle);
    border: 1px solid var(--border);
    transition: background var(--dur) var(--ease-out), border-color var(--dur) var(--ease-out);
  }

  .switch::after {
    content: '';
    position: absolute;
    top: 2px;
    left: 2px;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: var(--text-primary);
    border: 1px solid var(--border);
    transition: transform var(--dur) var(--ease-out);
  }

  .switch.on {
    background: var(--accent);
    border-color: var(--accent);
  }

  .switch.on::after {
    transform: translateX(18px);
    border-color: #fff;
  }

  input:focus-visible + .switch {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }

  .copy {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .title {
    font-size: 14px;
    font-weight: 600;
  }

  .hint {
    font-size: 13px;
    color: var(--text-secondary);
  }

  @media (forced-colors: active) {
    .switch {
      background: Canvas;
      border: 2px solid CanvasText;
    }

    .switch::after {
      background: Canvas;
      border: 2px solid CanvasText;
    }

    .switch.on {
      background: Highlight;
      border-color: Highlight;
    }

    .switch.on::after {
      border-color: HighlightText;
      background: HighlightText;
    }

    input:focus-visible + .switch {
      outline: 2px solid Highlight;
    }
  }
</style>
