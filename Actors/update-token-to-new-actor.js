/*
 * This will update a selected token to point to a new actor of the same name.
 *
 * This was initially created to allow me to use the R20Importer for PF1 more effectively.
 * When the R20Importer imports the Tokens/Actors the ability to load its sheet gets broken,
 * but the PF1 Statblock Library has all of the sheets.  After I import a character from
 * the PF1 Statblock Library, I can select the corresponding token on my map, run this macro,
 * and it will copy the token image to the Statblock Library imported actor, then update
 * the token to point to that new actor, and finally rename the old one (you could delete
 * if desired).
 */
main();

async function main() {
    // Get selected token
    if (canvas.tokens.controlled.length != 1) {
        ui.notifications.error("You must select a single token.");
        return;
    }
    let token = canvas.tokens.controlled[0]

    // Get its actor
    let originalActor = token.actor;
    let originalActorId = originalActor.id;
    console.log(`Original Actor ID: ${originalActorId}`);

    // Find the library actor with the same name
    // TODO: Is there a way to know if its a library imported one
    let possibleActors = [];
    game.actors.forEach((actor) => {
        if (actor.name == originalActor.name && actor.id != originalActor.id) {
            possibleActors.push(actor);
        }
    });

    let newActor;
    if (possibleActors.length == 0) {
        ui.notifications.error("Could not find a matching Actor to point token at.");
        return;
    } else if (possibleActors.length == 1) {
        newActor = possibleActors[0];
    } else if (possibleActors.length > 1) {
        ui.notifications.warn("Found more than one possible actors, using first.");
        newActor = possibleActors[0];
    }
    console.log(`New Actor ID: ${newActor.id}`);

    // update the library actor's image and set AC
    let desiredImage = originalActor.img;
    await newActor.update({"img": desiredImage, "prototypeToken.bar2.attribute": "attributes.ac.normal.total"});
    console.log("Updated new Actor image and prototype.");

    // Update the token on the scene to reflect the bar change
    let tokenUpdateData = {
        _id: token.id,
        "actorId": newActor.id,
        "bar2.attribute": "attributes.ac.normal.total"
    };
    await canvas.scene.updateEmbeddedDocuments('Token', [tokenUpdateData]);
    console.log("Updated token to point to new Actor and updated bar.");

    // Rename the original actor
    originalActor = game.actors.get(originalActorId); // one of the other updates removes this
    await originalActor.update({"name": originalActor.name + " (OLD)"});
    console.log("Renamed old token for for clarity.")
    // await game.actors.get(originalActorId).delete();
}