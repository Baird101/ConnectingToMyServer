
function think(x, y, ang, s) {
    var target = null;
    var targetD = 1000;
    var flee = false;

    // Avoid the edge
    var edgeD = dist(x, y, 0, 0);
    var maxD = world.s / 2 - s / 2;
    var edgeRange = 120;

    if (edgeD > maxD - edgeRange) {
        return atan2(-y, -x);
    }

    // Find nearby threats
    for (var i = 0; i < players.length; i++) {
        var p = players[i];

        if (p.x === x && p.y === y) {
            continue;
        }

        var d = dist(p.x, p.y, x, y);

        if (p.s > s * 1.15 && d < 250 && d < targetD) {
            target = p;
            targetD = d;
            flee = true;
        }
    }

    // Hunt smaller players when safe
    if (!flee) {
        for (var i = 0; i < players.length; i++) {
            var p = players[i];
            var d = dist(p.x, p.y, x, y);

            if (p.x === x && p.y === y) {
                continue;
            }

            if (p.s < s * 0.85 && d < 350 && d < targetD) {
                target = p;
                targetD = d;
            }
        }
    }

    // Find food when no player is a target
    if (!flee && target === null) {
        for (var i = 0; i < foods.length; i++) {
            var f = foods[i];
            var d = dist(f.x, f.y, x, y);

            if (d < targetD) {
                target = f;
                targetD = d;
            }
        }
    }

    // Return the desired angle
    if (target !== null) {
        var targetAng = atan2(
            target.y - y,
            target.x - x
        );

        if (flee) {
            targetAng += 180;
        }

        return targetAng;
    }

    // Continue in the current direction
    return ang;
}
