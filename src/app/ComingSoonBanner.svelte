<script lang="ts"></script>

<aside class="soon" role="status">
  <p>Coming soon <span class="date">December 15, 2026</span></p>
</aside>

<style>
  .soon {
    position: relative;
    background: #000;
    color: var(--text-primary);
    border-top: 1px solid var(--border);
    border-bottom: 1px solid var(--accent);
    text-align: center;
    overflow: hidden;
  }

  p {
    position: relative;
    margin: 0;
    padding: 12px 16px;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.18em;
    text-transform: uppercase;
  }

  .date {
    display: inline-block;
    margin-left: 8px;
    color: var(--accent);
    letter-spacing: 0.12em;
    animation: pulse-red 2.8s var(--ease-out) infinite;
  }

  @keyframes pulse-red {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.55;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .date {
      animation: none;
    }
  }

  @media (forced-colors: active) {
    .soon {
      background: Canvas;
      color: CanvasText;
      border-color: CanvasText;
    }

    .date {
      color: LinkText;
      animation: none;
    }
  }
</style>
