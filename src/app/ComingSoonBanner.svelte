<script lang="ts"></script>

<aside class="soon" role="status">
  <p>Coming soon <span class="date">December 15, 2026</span></p>
</aside>

<style>
  .soon {
    position: relative;
    background: transparent;
    color: var(--on-ink-muted);
    border-top: 1px solid color-mix(in srgb, var(--on-ink) 12%, transparent);
    text-align: center;
    overflow: hidden;
  }

  p {
    position: relative;
    margin: 0;
    padding: 14px 16px;
    font-size: 13px;
    font-weight: 800;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }

  .date {
    display: inline-block;
    margin-left: 8px;
    color: var(--accent);
    letter-spacing: 0.08em;
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
