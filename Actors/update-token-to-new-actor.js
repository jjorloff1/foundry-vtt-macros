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

function isAnyObjectEmpty(...objects) {
    // isEmpty() is a foundry utility method stored in common.js
    return !objects.every(object => !isEmpty(object));
}

async function askUserToConfirmUnexpectedActor(newActor) {
    return await Dialog.confirm({
        title: "Unexpected Actor Found",
        content: "Attempted to find an actor imported from the statblock library with the terror.svg image. " +
            `Could not find that one, but another actor is available: ${newActor.id}. ` +
            "Do you wish to update this actor with the selected token?",
        yes: () => true,
        no: () => false
    });
}

async function findAnotherActorWithSameName(originalActor) {
    if (isEmpty(originalActor)) {
        return null;
    }

    let possibleActors = [];
    game.actors.forEach((actor) => {
        if (actor.name == originalActor.name && actor.id != originalActor.id) {
            possibleActors.push(actor);
        }
    });

    let newActor;
    if (possibleActors.length == 0) {
        ui.notifications.error("Could not find a matching Actor to point token at.");
    } else if (possibleActors.length >= 1) {
        // Attempt to find an actor imported by the pf1 statblock library (all come with generic terror.svg)
        newActor = possibleActors.find((actor) => actor.img === "icons/svg/terror.svg")

        if (isEmpty(newActor)) {
            // Ask the user if they would like to use a non-statblock-library Actor
            newActor = possibleActors[0];

            if (!await askUserToConfirmUnexpectedActor(newActor)) {
                return null;
            }
        }
    }
    return newActor;
}

async function updateActorWithNewImageAndSetBar2ToAC(newActor, desiredImage) {
    // I want to have bar2 represent AC, and the default for the library does not do so, so I update that here
    await newActor.update({"img": desiredImage, "prototypeToken.bar2.attribute": "attributes.ac.normal.total"});
    console.log("Updated new Actor image and prototype.");
}

function generateTokenActorTransferUpdates(scene, originalActorId, newActorId) {
    let tokenUpdates = [];
    if (isAnyObjectEmpty(scene, originalActorId, newActorId)) {
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
    if (isEmpty(tokenUpdates)) {
        return;
    }

    // Update the tokens on the scene
    scene.updateEmbeddedDocuments('Token', tokenUpdates);
    console.log(`Updated ${tokenUpdates.length} ${newActor.name} tokens on scene ${scene.name}`)
}

function updateAllTokensOfActorOnAllScenesToNewActor(originalActorId, newActor) {
    if (isAnyObjectEmpty(originalActorId, newActor)) {
        return;
    }

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

    let originalActor = token.actor;
    let originalActorId = originalActor.id;
    console.log(`Original Actor ID: ${originalActorId}`);

    let newActor = await findAnotherActorWithSameName(originalActor);
    if (isEmpty(newActor)) {
        return;
    }
    console.log(`New Actor ID: ${newActor.id}`);

    await updateActorWithNewImageAndSetBar2ToAC(newActor, originalActor.img);

    updateAllTokensOfActorOnAllScenesToNewActor(originalActorId, newActor);

    // Rename the original actor to its easy to see
    deprecateActorName(originalActorId);
    // await game.actors.get(originalActorId).delete();
}