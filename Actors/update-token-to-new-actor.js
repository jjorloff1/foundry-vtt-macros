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

function findAnotherActorWithSameName(originalActor) {
    let possibleActors = [];
    game.actors.forEach((actor) => {
        // TODO: Is there a way to know if its a library imported one
        if (actor.name == originalActor.name && actor.id != originalActor.id) {
            possibleActors.push(actor);
        }
    });

    let newActor;
    if (possibleActors.length == 0) {
        // TODO: Does this log as well?
        ui.notifications.error("Could not find a matching Actor to point token at.");
    } else if (possibleActors.length == 1) {
        newActor = possibleActors[0];
    } else if (possibleActors.length > 1) {
        ui.notifications.warn("Found more than one possible actors, using first.");
        newActor = possibleActors[0];
    }
    return newActor;
}

async function updateActorWithNewImageAndSetBar2ToAC(newActor, desiredImage) {
    await newActor.update({"img": desiredImage, "prototypeToken.bar2.attribute": "attributes.ac.normal.total"});
    console.log("Updated new Actor image and prototype.");
}

function generateTokenActorTransferUpdates(scene, originalActorId, newActorId) {
    let tokenUpdates = [];
    if (scene.tokens.size > 0) {
        return tokenUpdates;
    }

    // Iterate through tokens and see if they match
    scene.tokens.forEach((token) => {
        if (token.actor != null && token.actor.id == originalActorId) {
            // Update this token to point to the new Actor
            tokenUpdates.push({
                _id: token.id,
                "actorId": newActorId,
                "bar2.attribute": "attributes.ac.normal.total"
            });
        }
    });

    return tokenUpdates
}

function updateTokensOnScene(tokenUpdates, scene, newActor) {
    if (tokenUpdates == null || tokenUpdates == undefined )
    if (tokenUpdates.length > 0) {
        // Update the tokens on the scene
        scene.updateEmbeddedDocuments('Token', tokenUpdates);
        console.log(`Updated ${tokenUpdates.length} ${newActor.name} tokens on scene ${scene.name}`)
    }
}

function updateAllTokensOfActorOnAllScenesToNewActor(originalActorId, newActor) {
    game.scenes.forEach((scene) => {
        let tokenUpdates = generateTokenActorTransferUpdates(scene, originalActorId, newActor.id);

        updateTokensOnScene(tokenUpdates, scene, newActor);
    });
}

function deprecateActorName(actorId) {
    let actor = game.actors.get(actorId); // one of the other updates removes this
    actor.update({"name": actor.name + " (OLD)"});
    console.log("Renamed old token for for clarity.")
}

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

    let newActor = findAnotherActorWithSameName(originalActor);
    if (newActor == null || newActor == undefined) {
        return;
    }
    console.log(`New Actor ID: ${newActor.id}`);

    await updateActorWithNewImageAndSetBar2ToAC(newActor, originalActor.img);

    updateAllTokensOfActorOnAllScenesToNewActor(originalActorId, newActor);

    // Rename the original actor to its easy to see
    deprecateActorName(originalActorId);
    // await game.actors.get(originalActorId).delete();
}