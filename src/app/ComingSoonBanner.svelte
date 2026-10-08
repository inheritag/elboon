<script lang="ts"></script>

<aside class="soon" role="status">
  <p>Coming soon <span class="date">December 15, 2026</span></p>
</aside>

<style>
  .soon {
    position: relative;
    background: var(--ink);
    color: #fff;
    text-align: center;
    overflow: hidden;
  }

  p {
    position: relative;
    margin: 0;
    padding: 8px 16px;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.16em;
    text-transform: uppercase;
  }

  .date {
    display: inline-block;
    margin-left: 10px;
    color: #fff;
    letter-spacing: 0.16em;
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
