main();

async function main() {
    let actor1 = game.actors.get("6mlkshrCyVoPyivp");
    let actor2 = game.actors.get("36iciDAsYfgKkSK3");

    let actor1Image = actor1.img;
    console.log(actor1Image);
    let actor2Image = actor2.img;
    console.log(actor2Image);

    actor1.update({"img": actor2Image});
    console.log("updated actor1")
    actor2.update({"img": actor1Image});
    console.log("updated actor2")
}