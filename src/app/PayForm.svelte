<script lang="ts">
  let {
    email = $bindable(''),
    collectEmail = true,
    submitLabel = 'Pay with Visa or Mastercard',
    busy = false,
    error = '',
    devHint = false,
    onPay
  }: {
    email?: string;
    collectEmail?: boolean;
    submitLabel?: string;
    busy?: boolean;
    error?: string;
    devHint?: boolean;
    onPay: (payload: {
      email: string;
      shippingAddress: {
        fullName: string;
        phone: string;
        line1: string;
        line2: null;
        city: string;
        postcode: string;
        country: string;
      };
      card: { number: string; expiry: string; cvc: string; nameOnCard: string };
    }) => void;
  } = $props();

  let fullName = $state('');
  let phone = $state('');
  let line1 = $state('');
  let city = $state('');
  let postcode = $state('');
  let country = $state('Nigeria');
  let cardNumber = $state('');
  let expiry = $state('');
  let cvc = $state('');
  let nameOnCard = $state('');

  function submit(event: SubmitEvent) {
    event.preventDefault();
    onPay({
      email,
      shippingAddress: { fullName, phone, line1, line2: null, city, postcode, country },
      card: { number: cardNumber, expiry, cvc, nameOnCard }
    });
  }
</script>

<form onsubmit={submit} class="card pay-form">
  <h2>Delivery</h2>
  <p class="hint">No account. We only pass these details to our logistics partner for this order.</p>

  {#if collectEmail}
    <div class="field">
      <label for="email">Email</label>
      <input id="email" type="email" bind:value={email} required />
    </div>
  {/if}
  <div class="field">
    <label for="fullName">Full name</label>
    <input id="fullName" bind:value={fullName} required />
  </div>
  <div class="field">
    <label for="phone">Phone</label>
    <input id="phone" type="tel" bind:value={phone} required placeholder="For the delivery partner" />
  </div>
  <div class="field">
    <label for="line1">Address</label>
    <input id="line1" bind:value={line1} required />
  </div>
  <div class="field">
    <label for="city">City</label>
    <input id="city" bind:value={city} required />
  </div>
  <div class="field">
    <label for="postcode">Postcode</label>
    <input id="postcode" bind:value={postcode} required />
  </div>
  <div class="field">
    <label for="country">Country</label>
    <input id="country" bind:value={country} required />
  </div>

  <h2>Card</h2>
  <p class="hint">Visa and Mastercard only. We never store the full card number.</p>
  {#if devHint}
    <p class="hint">Test Visa: 4242 4242 4242 4242 · any future expiry · any CVC</p>
  {/if}

  <div class="field">
    <label for="nameOnCard">Name on card</label>
    <input id="nameOnCard" bind:value={nameOnCard} required autocomplete="cc-name" />
  </div>
  <div class="field">
    <label for="cardNumber">Card number</label>
    <input
      id="cardNumber"
      bind:value={cardNumber}
      required
      inputmode="numeric"
      autocomplete="cc-number"
      placeholder="•••• •••• •••• ••••"
    />
  </div>
  <div class="grid-2">
    <div class="field">
      <label for="expiry">Expiry (MM/YY)</label>
      <input id="expiry" bind:value={expiry} required placeholder="12/29" autocomplete="cc-exp" />
    </div>
    <div class="field">
      <label for="cvc">CVC</label>
      <input id="cvc" bind:value={cvc} required inputmode="numeric" autocomplete="cc-csc" />
    </div>
  </div>

  <button class="btn btn-primary" type="submit" disabled={busy}>
    {busy ? 'Paying…' : submitLabel}
  </button>
  {#if error}
    <p class="error-text">{error}</p>
  {/if}
</form>

<style>
  .pay-form {
    padding: 20px;
  }

  h2 {
    font-size: 18px;
    margin: 8px 0 4px;
  }

  .hint {
    color: var(--text-secondary);
    font-size: 14px;
    margin-bottom: 16px;
  }

  .grid-2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0 16px;
  }
</style>
