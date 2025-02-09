<script lang="ts">
let source = "" as unknown as MessageEventSource;
let origin = "";
window.addEventListener("message", (event) => {
	console.log(event.data);
	if (!event.source) return;
	source = event.source;
	origin = event.origin;
	if (event.data === "ping") {
		event.source.postMessage("pong", {
			targetOrigin: event.origin,
		});
	}
});
</script>

<main>
	<div class="row">
		<input class="input rowMain" type="text" placeholder="server address" value="mimulti.astraeffect.com">
		<button class="input">Join</button>
	</div>
</main>