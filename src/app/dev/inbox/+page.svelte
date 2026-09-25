<script lang="ts">
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();
</script>

<section class="container inbox">
  <h1>Dev inbox</h1>
  <p>Emails that would have gone out via Resend. Offer replies include the checkout link.</p>

  {#each data.emails as email}
    <article class="card email">
      <p class="meta">{new Date(email.sentAt).toLocaleString('en-GB')} · to {email.to}</p>
      <h2>{email.subject}</h2>
      <div class="body">{@html email.html}</div>
    </article>
  {:else}
    <p>No emails yet. Place an order or respond to an offer.</p>
  {/each}
</section>

<style>
  .inbox {
    padding: 32px 0 48px;
    max-width: 720px;
  }

  .email {
    padding: 20px;
    margin: 16px 0;
  }

  .meta {
    color: var(--text-muted);
    font-size: 13px;
  }

  h2 {
    font-size: 18px;
    margin: 6px 0 12px;
  }

  .body :global(a) {
    color: var(--accent);
    text-decoration: underline;
  }
</style>
