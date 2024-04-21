main();

/**
 * This macro swaps the images of 2 actors and their selected tokens.
 * Select two tokens representing two different actors and it will swap the images.
 *
 * @returns {Promise<void>}
 */
async function main() {
    // Get 2 selected tokens
    if (canvas.tokens.controlled.length != 2) {
        ui.notifications.error("You must select two tokens.");
        return;
    }
    let token1 = canvas.tokens.controlled[0];
    let token2 = canvas.tokens.controlled[1];

    let actor1 = game.actors.get(token1.actor.id);
    let actor2 = game.actors.get(token2.actor.id);

    let actor1Image = actor1.img;
    console.log(actor1Image);
    let actor2Image = actor2.img;
    console.log(actor2Image);

    token1.document.update({"img": actor2Image});
    actor1.update({"img": actor2Image});
    console.log("updated token1 and actor1")
    token2.document.update({"img": actor1Image});
    actor2.update({"img": actor1Image});
    console.log("updated token2 and actor2");
}