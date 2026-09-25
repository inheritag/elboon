<script lang="ts">
  const flakes = [
    { x: 3, d: 11, delay: 0, s: 7, drift: 14 },
    { x: 9, d: 15, delay: 2.1, s: 10, drift: -10 },
    { x: 16, d: 12, delay: 5.4, s: 6, drift: 18 },
    { x: 22, d: 17, delay: 1.2, s: 12, drift: -16 },
    { x: 28, d: 10, delay: 7.8, s: 8, drift: 8 },
    { x: 35, d: 14, delay: 3.3, s: 9, drift: -12 },
    { x: 41, d: 16, delay: 0.6, s: 5, drift: 20 },
    { x: 48, d: 13, delay: 8.9, s: 11, drift: -8 },
    { x: 54, d: 11, delay: 4.7, s: 7, drift: 11 },
    { x: 61, d: 18, delay: 2.8, s: 13, drift: -18 },
    { x: 67, d: 12, delay: 6.1, s: 6, drift: 9 },
    { x: 73, d: 15, delay: 1.9, s: 9, drift: -14 },
    { x: 80, d: 10, delay: 9.4, s: 8, drift: 16 },
    { x: 86, d: 14, delay: 5.0, s: 11, drift: -7 },
    { x: 92, d: 16, delay: 3.6, s: 6, drift: 13 },
    { x: 97, d: 12, delay: 7.2, s: 10, drift: -11 }
  ];
</script>

<aside class="frozen" role="status">
  <div class="snow" aria-hidden="true">
    {#each flakes as flake}
      <svg
        class="flake"
        style="--x:{flake.x}%; --d:{flake.d}s; --delay:{flake.delay}s; --s:{flake.s}px; --drift:{flake.drift}px"
        viewBox="0 0 12 12"
        fill="none"
      >
        <path
          d="M6 0v12M0 6h12M1.8 1.8l8.4 8.4M10.2 1.8l-8.4 8.4"
          stroke="currentColor"
          stroke-width="1.1"
          stroke-linecap="square"
        />
      </svg>
    {/each}
  </div>
  <p><span class="word">Frozen.</span> Not taking orders yet.</p>
  <div class="icicles" aria-hidden="true"></div>
</aside>

<style>
  .frozen {
    position: relative;
    z-index: 1;
    overflow: visible;
    background: var(--text-primary);
    color: var(--bg);
    border-top: 2px solid var(--accent);
    text-align: center;
  }

  .snow {
    position: absolute;
    inset: 0;
    overflow: hidden;
    pointer-events: none;
  }

  .flake {
    position: absolute;
    top: -16px;
    left: var(--x);
    width: var(--s);
    height: var(--s);
    color: var(--bg);
    opacity: 0.75;
    animation: flake-fall var(--d) linear var(--delay) infinite;
  }

  @keyframes flake-fall {
    0% {
      transform: translate3d(0, 0, 0) rotate(0deg);
      opacity: 0;
    }
    12% {
      opacity: 0.8;
    }
    100% {
      transform: translate3d(var(--drift), 72px, 0) rotate(120deg);
      opacity: 0;
    }
  }

  p {
    position: relative;
    z-index: 1;
    margin: 0;
    padding: 12px 16px 14px;
    font-size: 14px;
    font-weight: 500;
    letter-spacing: 0.02em;
  }

  .word {
    font-family: var(--font-display);
    font-weight: 800;
    font-size: 16px;
    letter-spacing: -0.03em;
    margin-right: 6px;
  }

  .icicles {
    position: absolute;
    left: 0;
    right: 0;
    bottom: -12px;
    height: 12px;
    pointer-events: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='12' viewBox='0 0 56 12'%3E%3Cpath fill='%23f3f1ec' stroke='%2314110e' stroke-width='0.6' d='M0 0 L6 10 L12 0 L19 12 L27 0 L34 8 L42 0 L49 11 L56 0 Z'/%3E%3C/svg%3E");
    background-repeat: repeat-x;
    background-position: center top;
  }

  @media (max-width: 720px) {
    p {
      padding: 10px 16px 12px;
      font-size: 13px;
    }

    .word {
      font-size: 15px;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .flake {
      animation: none;
      opacity: 0.35;
      top: 8px;
    }
  }

  @media (forced-colors: active) {
    .frozen {
      background: Canvas;
      color: CanvasText;
      border-top: 2px solid CanvasText;
    }

    .snow,
    .icicles {
      display: none;
    }
  }
</style>
