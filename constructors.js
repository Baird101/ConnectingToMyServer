function Player(config) {
    this.vx = 0;
    this.vy = 0;
    this.frict = 0.95;
    this.speed = 2;
    this.wanderAng = 0;

    for (var key in config) {
        this[key] = config[key];
    }

    if (!this.name) {
        this.name = this.username || "Player";
    }

    if (typeof this.ts !== "number") {
        this.ts = this.s;
    }

    if (typeof createGraphics === "function") {
        this.genImg();
        this.s = 1;
    }
}
Player.prototype.move = function() {
    var allPlayers = [];

    if (typeof players !== "undefined") {
        allPlayers = allPlayers.concat(players);
    }
    if (typeof bots !== "undefined") {
        allPlayers = allPlayers.concat(bots);
    }

    if (this.type === "bot") {
        var target = null;
        var targetD = 1000;
        var flee = false;

        var edgeD = Math.sqrt(this.x * this.x + this.y * this.y);
        var maxD = world.s / 2 - this.s / 2;
        var edgeRange = 120;

        if (edgeD > maxD - edgeRange) {
            var edgeEffect = (edgeD - (maxD - edgeRange)) / edgeRange;
            var edgeAng = Math.atan2(-this.y, -this.x);
            this.vx += Math.cos(edgeAng) * this.speed * edgeEffect;
            this.vy += Math.sin(edgeAng) * this.speed * edgeEffect;
        }

        for (var i = 0; i < allPlayers.length; i++) {
            var p = allPlayers[i];

            if (p === this) {
                continue;
            }

            var dx = p.x - this.x;
            var dy = p.y - this.y;
            var d = Math.sqrt(dx * dx + dy * dy);

            if (p.s > this.s * 1.15 && d < 250) {
                if (!flee || d < targetD) {
                    target = p;
                    targetD = d;
                }
                flee = true;
            }
        }

        if (!flee) {
            target = null;
            targetD = 1000;

            for (var i = 0; i < allPlayers.length; i++) {
                var p = allPlayers[i];

                if (p === this) {
                    continue;
                }

                var dx = p.x - this.x;
                var dy = p.y - this.y;
                var d = Math.sqrt(dx * dx + dy * dy);

                if (p.s < this.s * 0.85 && d < 350 && d < targetD) {
                    target = p;
                    targetD = d;
                }
            }
        }

        if (!flee && target === null && typeof foods !== "undefined") {
            for (var i = 0; i < foods.length; i++) {
                var f = foods[i];
                var dx = f.x - this.x;
                var dy = f.y - this.y;
                var d = Math.sqrt(dx * dx + dy * dy);

                if (d < targetD) {
                    target = f;
                    targetD = d;
                }
            }
        }

        if (target !== null) {
            var ang = Math.atan2(target.y - this.y, target.x - this.x);

            if (flee) {
                ang += Math.PI;
            }

            this.vx += Math.cos(ang) * this.speed * (flee ? 0.18 : 0.12);
            this.vy += Math.sin(ang) * this.speed * (flee ? 0.18 : 0.12);
        } else {
            this.wanderAng += 2;
            this.vx += Math.cos(this.wanderAng * Math.PI / 180) * this.speed * 0.08;
            this.vy += Math.sin(this.wanderAng * Math.PI / 180) * this.speed * 0.08;
        }
    } else if (typeof this.ang === "number") {
        var ang = this.ang * Math.PI / 180;
        this.vx += Math.cos(ang) * this.speed;
        this.vy += Math.sin(ang) * this.speed;
    }

    var v = Math.sqrt(this.vx * this.vx + this.vy * this.vy);

    if (v > this.speed) {
        this.vx = this.vx / v * this.speed;
        this.vy = this.vy / v * this.speed;
    }

    this.x += this.vx;
    this.y += this.vy;

    this.vx *= this.frict;
    this.vy *= this.frict;

    var d = Math.sqrt(this.x * this.x + this.y * this.y);
    var maxD = world.s / 2 - this.s / 2;

    if (d > maxD) {
        var ang = Math.atan2(this.y, this.x);

        this.x = Math.cos(ang) * maxD;
        this.y = Math.sin(ang) * maxD;
        this.vx *= -0.5;
        this.vy *= -0.5;
    }
};
Player.prototype.display = function() {
    if (this.playerImg && this.nameImg) {
        image(this.playerImg, this.x, this.y, this.s, this.s);
        textSize(this.s / 3);
        image(
            this.nameImg,
            this.x,
            this.y - this.s / 2,
            textWidth(this.name),
            this.s / 3
        );
    } else {
        // stroke(0, 0, 0, 150);
        // strokeWeight(2);
        // fill(this.col);
        // ellipse(this.x, this.y, this.s, this.s);

        // noStroke();
        // fill(255);
        // textAlign(CENTER, CENTER);
        // textSize(Math.max(10, this.s / 3));
        // text(this.name || this.username || "Player",
        //     this.x, this.y - this.s / 2 - 10);
    }
};
Player.prototype.detectEat = function(array, mult) {
    for (var i = 0; i < array.length; i++) {
        var p = array[i];

        if (
            this !== p &&
            this.s > p.s &&
            dist(this.x, this.y, p.x, p.y) <= this.s / 2 - p.s / 2
        ) {
            if (p === myPlayer) {
                playerDead = true;
            }

            this.ts += (p.s - 10) * mult;
            array.splice(i, 1);
            i--;
        }
    }
};
Player.prototype.genImg = function() {
    var g = createGraphics(304, 304, '');

    g.textAlign(CENTER, BASELINE);
    g.background(0, 0);
    g.strokeWeight(2);
    g.stroke(0, 0, 0, 150);
    g.fill(this.col);
    g.ellipse(150, 150, 300, 300);

    this.playerImg = g.get();

    textSize(100);
    var b = createGraphics(textWidth(this.name), 100, '');
    b.background(0, 0);
    b.textAlign(LEFT, BASELINE);
    b.fill(255, 255, 255);
    b.textSize(100);
    b.text(this.name, 0, 100);

    this.nameImg = b.get();
};


function Food(config) {
    this.speed = 0.2;
    this.vx = 0;
    this.vy = 0;
    this.angOff = 0;
    
    for (var key in config) {
        this[key] = config[key];
    }
}
Food.prototype.display = function(){
    strokeWeight(3);
    stroke(0, 0, 0, 150);
    fill(this.col);
    ellipse(this.x, this.y, this.s, this.s);
    
};
Food.prototype.move = function() {
    this.wanderAng = (this.wanderAng || this.ang || 0) + 1.5;

    var ang = this.wanderAng * Math.PI / 180;

    this.vx += Math.cos(ang) * this.speed;
    this.vy += Math.sin(ang) * this.speed;

    this.vx = Math.max(-this.speed, Math.min(this.speed, this.vx));
    this.vy = Math.max(-this.speed, Math.min(this.speed, this.vy));

    this.x += this.vx;
    this.y += this.vy;

    var d = Math.sqrt(this.x * this.x + this.y * this.y);
    var maxD = world.s / 2 - this.s / 2;

    if (d > maxD) {
        var ang = Math.atan2(this.y, this.x);

        this.x = Math.cos(ang) * maxD;
        this.y = Math.sin(ang) * maxD;
        this.angOff = ang * 180 / Math.PI;
        this.vx *= -0.5;
        this.vy *= -0.5;
    }
};


if (typeof module !== "undefined" && module.exports) {
    module.exports = {
        Player: Player,
        Food: Food
    };
}
