function runMain() {
  "use strict";
  var guard;
  var weapon;
  var next = window.confirm("Amanda informs you that the helm is directly to the right of your position. She advises you to avoid it and go left instead.\n\nFollow her advice?");
  if (next) {
    next = window.confirm("You safely reach a storage closet.\n\nAmanda informs you that you need to turn right at the next fork to reach the ship's generator.\n\nFollow her advice?");
  }
  if (next) {
    next = window.confirm("You safely reach another storage closet and see an entrance to the generator room farther down the corridor.\n\nAmanda advises you to take a longer route with fewer guards to reach the room.\n\nFollow her advice?");
  }
  if (next) {
    guard = true;
    next = window.confirm("Unfortunately, there are no storage closets here. You carelessly run into a guard, who punches you in the face, breaking your Sacred Communication Device.\n\nPunch back at them?");
    next = !next;
  }
  if (next) {
    next = window.confirm("Tackle them?");
    next = !next;
  }
  if (next) {
    next = window.confirm("Make fun of their parentage?");
    next = !next;
  }
  if (next) {
    next = window.confirm("Use your Sacred Paralyzer Device?");
  }
  if (next) {
    guard = false;
    next = window.confirm("The guard falls unconscious.\n\nTake some time to steal their uniform?");
    next = !next;
  }
  if (next) {
    next = window.confirm("Make a dash for the nearby weapons cache?");
  }
  if (next) {
    weapon = window.confirm("You hide in the weapons cache and find Unholy Explosive Devices all around you.\n\nTake some time to steal one?");
    next = window.confirm("You see an entrance to the generator room up ahead.\n\nGo towards it?");
  }
  if (next) {
    guard = true;
    if (weapon) {
      next = window.confirm("You reach the ship's generator, but a nearby guard notices you.\n\nQuickly throw your Unholy Explosive Device at the generator?");
    } else {
      next = false;
      window.alert("You reach the ship's generator, but a nearby guard notices you.\n\nYou panic, and the guard swiftly disarms you.");
    }
  }
  if (next) {
    guard = false;
    next = window.confirm("The Unholy Explosive Device detonates and destroys the generator. Other parts of the ship also start exploding. Through one of the room's exits, you see the docking bay.\n\nGo towards it?");
  }
  if (next) {
    next = window.confirm("You see that Amanda managed to hack into the docking bay to place the Sacred Deity Vessel there.\n\nClimb in?");
  }
  if (next) {
    window.alert("You climb into the Sacred Deity Vessel and begin to fly away. However, an Unholy Green Triangle Vessel rams into you, forcing you to eject. Press OK and wait for the next page to load...");
    window.location.href = "/4internetcont.html";
  }
  
  if (!next) {
    if (guard) {
      window.alert("The guard restrains you and kicks you out.");
    } else {
      window.alert("A guard catches you and kicks you out.");
    }
  }
}