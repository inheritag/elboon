<script lang="ts">
  let {
    name,
    id = name,
    min = 0,
    step = 1,
    value = $bindable<number | ''>(0),
    required = false
  }: {
    name: string;
    id?: string;
    min?: number;
    step?: number;
    value?: number | '';
    required?: boolean;
  } = $props();

  function round(n: number): number {
    const decimals = String(step).includes('.') ? String(step).split('.')[1].length : 0;
    return Number(n.toFixed(decimals));
  }

  function bump(dir: number) {
    const current = Number(value);
    const next = (Number.isFinite(current) ? current : 0) + dir * step;
    value = round(Math.max(min, next));
  }
</script>

<div class="stepper" role="group">
  <button type="button" class="step" onclick={() => bump(-1)} disabled={Number(value) <= min} aria-label="Decrease">
    -
  </button>
  <input {id} {name} type="number" {min} {step} {required} bind:value />
  <button type="button" class="step" onclick={() => bump(1)} aria-label="Increase">+</button>
</div>

<style>
  .stepper {
    display: flex;
    align-items: stretch;
    border: 1px solid var(--border);
    border-radius: var(--card-radius);
    background: #fff;
    overflow: hidden;
  }

  input {
    flex: 1;
    width: 0;
    min-width: 0;
    border: none;
    padding: 10px 8px;
    text-align: center;
    font-family: var(--font-body);
    font-size: 15px;
    font-variant-numeric: tabular-nums;
    background: transparent;
    border-radius: 0;
  }

  input:focus {
    outline: none;
  }

  .stepper:focus-within {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }

  .step {
    width: 40px;
    border: none;
    background: var(--bg-subtle);
    font-size: 18px;
    font-weight: 600;
    cursor: pointer;
    color: var(--text-primary);
  }

  .step:hover:not(:disabled) {
    background: color-mix(in srgb, var(--bg-subtle) 70%, var(--border));
  }

  .step:active:not(:disabled) {
    transform: scale(0.98);
  }

  .step:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  @media (forced-colors: active) {
    .stepper {
      border: 2px solid CanvasText;
      background: Field;
    }

    input {
      color: FieldText;
      background: Field;
    }

    .step {
      background: ButtonFace;
      color: ButtonText;
      border-inline: 1px solid ButtonText;
    }

    .step:disabled {
      color: GrayText;
      opacity: 1;
    }

    .stepper:focus-within {
      outline: 2px solid Highlight;
    }
  }
</style>
