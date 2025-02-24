<script lang="ts">
let init = false;
let source = "" as unknown as MessageEventSource;
let origin = "";
let connected = false;

const postMessage = (channel: string, data: string) => {
	if (!init) return false;
	source.postMessage(
		{ channel, data },
		{
			targetOrigin: origin,
		},
	);
};

window.addEventListener("message", (event) => {
	if (!event.source) return;
	source = event.source;
	origin = event.origin;
	if (event.data.channel === "ping") {
		const usernameElem = document.getElementById(
			"username",
		) as HTMLInputElement;
		usernameElem.value = event.data.data;

		if (init) return;
		init = true;
		postMessage("pong", "");
	}

	if (event.data.channel === "connect") {
		if (event.data.data === "success") {
			connected = true;
			return;
		}
	}

	if (event.data.channel === "disconnected") {
		connected = false;
		return;
	}
});

const buttonCalls = {
	closeOverlay: () => {
		postMessage("close", "");
	},
	leave: () => {
		postMessage("disconnect", "");
	},
	join: () => {
		const address = document.getElementById("address") as HTMLInputElement;
		const worldId = document.getElementById("worldId") as HTMLInputElement;
		const key = document.getElementById("key") as HTMLInputElement;
		const username = document.getElementById("username") as HTMLInputElement;
		postMessage(
			"connect",
			JSON.stringify({
				address: address.value,
				worldId: worldId.value,
				key: key.value,
				username: username.value,
			}),
		);
	},
};
</script>

<main id="main">
	{#if !connected}
		<input id="address" class="colMain row1" type="text" placeholder="Server Address" value="mimulti.astraeffect.com">
		<input id="worldId" class="colSub row1" type="text" placeholder="World Id">
		<input id="key" class="colMain row2" type="text" placeholder="Password">
		<input on:click={buttonCalls.join} class="colSub row2" type="button" value="Join">
	{:else}
		<input on:click={buttonCalls.leave} class="colMain row5" type="button" value="Leave">
	{/if}
	<input id="username" class="colSub row4 disabled" type="text" disabled>
	<input on:click={buttonCalls.closeOverlay} class="colSub row5" type="button" value="Close">
</main>