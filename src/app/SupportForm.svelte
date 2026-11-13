<script lang="ts">
  import { enhance } from '$app/forms';
  import type { ActionResult } from '@sveltejs/kit';

  let { initialEmail = '' }: { initialEmail?: string } = $props();

  let email = $state('');
  let message = $state('');
  let error = $state('');
  let sent = $state(false);
  let sending = $state(false);
  let seededEmail = false;

  $effect(() => {
    const next = initialEmail;
    if (seededEmail || !next) return;
    seededEmail = true;
    email = next;
  });

  function send() {
    error = '';
    sending = true;
    return async ({ result }: { result: ActionResult }) => {
      sending = false;
      if (result.type === 'success') {
        sent = true;
        message = '';
        return;
      }
      if (result.type === 'failure') {
        const data = result.data as { error?: string } | undefined;
        error = data?.error ?? 'We could not send that. Try again.';
      }
    };
  }
</script>

{#if sent}
  <p class="sent">Sent. We will reply by email.</p>
  <button type="button" class="again" onclick={() => (sent = false)}>Send another</button>
{:else}
  <form method="POST" action="/support?/send" use:enhance={send}>
    <p class="trap">
      <label for="support-company">Company</label>
      <input id="support-company" name="company" type="text" tabindex="-1" autocomplete="off" />
    </p>
    <label class="field">
      <span>Email</span>
      <input name="email" type="email" autocomplete="email" bind:value={email} required />
    </label>
    <label class="field">
      <span>Message</span>
      <textarea name="message" rows="4" bind:value={message} required placeholder="What do you need help with?"></textarea>
    </label>
    {#if error}<p class="error-text">{error}</p>{/if}
    <button class="btn btn-primary send" type="submit" disabled={sending}>
      {sending ? 'Sending…' : 'Send'}
    </button>
  </form>
{/if}

<style>
  form {
    position: relative;
  }

  .trap {
    position: absolute;
    left: -9999px;
    width: 1px;
    height: 1px;
    overflow: hidden;
  }

  .field span {
    display: block;
    font-size: 14px;
    font-weight: 600;
    margin-bottom: 8px;
  }

  textarea {
    min-height: 120px;
    resize: vertical;
  }

  .send {
    width: 100%;
    margin-top: 4px;
  }

  .sent,
  .error-text {
    margin-bottom: 12px;
  }

  .again {
    border: none;
    background: none;
    padding: 0;
    color: var(--ink);
    font: inherit;
    font-size: 14px;
    font-weight: 600;
    text-decoration: underline;
    text-underline-offset: 3px;
    cursor: pointer;
  }
</style>
