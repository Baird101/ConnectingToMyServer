function Player(config) {
    this.vx = 0;
    this.vy = 0;
    this.frict = 0.95;
    this.speed = 2;
    this.wanderAng = 0;
    
    for (var key in config) {
        this[key] = config[key];
    }
    
    if (typeof createGraphics === "function") {
        this.genImg();
    }
    
    this.ts = this.s;
    this.s = 1;
    
}
Player.prototype.display = function() {
    image(this.playerImg, this.x, this.y, this.s, this.s);
    textSize(this.s / 3);
    image(this.nameImg, this.x, this.y - this.s / 2, textWidth(this.name), this.s / 3);
};
Player.prototype.move = function() {
    if (this === myPlayer) {
        
        world.x += (this.x - width / 2 - world.x) / 20;
        world.y += (this.y - height / 2 - world.y) / 20;
        
        var ang = atan2(mouse.y - this.y, mouse.x - this.x);
        this.vx += cos(ang) * this.speed;
        this.vy += sin(ang) * this.speed;
        
    } else if (this.type === 'bot') {
        var target = null;
        var targetD = 1000;
        var flee = false;
        var danger = false;
        
        // Avoid the edge
        var edgeD = dist(this.x, this.y, 0, 0);
        var maxD = world.s / 2 - this.s / 2;
        var edgeRange = 120;
        
        if (edgeD > maxD - edgeRange) {
            var edgeEffect = (edgeD - (maxD - edgeRange)) / edgeRange;
            var edgeAng = atan2(-this.y, -this.x);
            
            this.vx += cos(edgeAng) * this.speed * edgeEffect;
            this.vy += sin(edgeAng) * this.speed * edgeEffect;
        }
        
        // Look for players
        for (var i = 0; i < players.length; i ++) {
            var p = players[i];
            
            if (p === this) {
                continue;
            }
            
            var d = dist(p.x, p.y, this.x, this.y);
            
            // Run from much larger players
            if (p.s > this.s * 1.15 && d < 250) {
                if (d < targetD || !flee) {
                    target = p;
                    targetD = d;
                    flee = true;
                }
                
                // Very close danger = dash away
                if (d < this.s + p.s) {
                    danger = true;
                }
            }
        }
        
        // Only hunt players if there isn't immediate danger
        if (!flee) {
            for (var i = 0; i < players.length; i ++) {
                var p = players[i];
                
                if (p === this) {
                    continue;
                }
                
                var d = dist(p.x, p.y, this.x, this.y);
                
                // Hunt smaller players
                if (p.s < this.s * 0.85 && d < 350) {
                    if (d < targetD) {
                        target = p;
                        targetD = d;
                        flee = false;
                    }
                }
            }
        }
        
        // Look for food
        if (!flee && target === null) {
            for (var i = 0; i < foods.length; i ++) {
                var f = foods[i];
                var d = dist(f.x, f.y, this.x, this.y);
                
                if (d < targetD) {
                    target = f;
                    targetD = d;
                    flee = false;
                }
            }
        }
        
        // Move toward target
        if (target !== null) {
            var ang = atan2(target.y - this.y, target.x - this.x);
            
            if (flee) {
                ang += 180;
            }
            
            this.vx += cos(ang) * this.speed * (flee ? 0.18 : 0.12);
            this.vy += sin(ang) * this.speed * (flee ? 0.18 : 0.12);
        } else {
            
            var wanderAng = noise(
                this.moveSeed,
                frameCount * 0.01
            ) * 360;
            
            this.vx += cos(wanderAng) * this.speed * 0.08;
            this.vy += sin(wanderAng) * this.speed * 0.08;
        }
    }
    
    
    var v = dist(this.vx, this.vy, 0, 0);
    
    if (v > this.speed) {
        this.vx = this.vx / v * this.speed;
        this.vy = this.vy / v * this.speed;
    }
    
    this.x += this.vx;
    this.y += this.vy;

    this.vx *= this.frict;
    this.vy *= this.frict;
    
    var d = dist(this.x, this.y, 0, 0);
    var maxD = world.s / 2 - this.s / 2;
    
    if (d > maxD) {
        var ang = atan2(this.y, this.x);
        
        this.x = cos(ang) * maxD;
        this.y = sin(ang) * maxD;
        
        this.vx *= -0.5;
        this.vy *= -0.5;
    }
};
Player.prototype.detectEat = function(array, mult) {
    for (var i = 0; i < array.length; i ++) {
        var p = array[i];
        
        if (this !== p && 
            this.s > p.s && 
            dist(this.x, this.y, p.x, p.y) <= this.s / 2 - p.s / 2) {
            if (p === myPlayer) {
                playerDead = true;
            }
            
            this.ts += (p.s - 10) * mult;
            array.splice(i, 1);
            i--;
        }
    }
};
Player.prototype.run = function() {
    this.display();
    this.move();
    this.detectEat(players, 0.2);
    this.detectEat(foods, 0.3);
    
    
    this.s += (this.ts - this.s) / 20;
    this.s = constrain(this.s, 10, world.s * 0.7);
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
Food.prototype.wander = function() {
    this.ang = noise(frameCount * 0.01 + this.offset) * 360 + this.angOff;
    this.vx += cos(this.ang);
    this.vy += sin(this.ang);
    
    this.vx = constrain(this.vx, -this.speed, this.speed);
    this.vy = constrain(this.vy, -this.speed, this.speed);
        
    this.x += this.vx;
    this.y += this.vy;
};
Food.prototype.run = function(){
    this.s += (this.ts - this.s) / 40;
    
    this.display();
    this.wander();
    
    var d = dist(this.x, this.y, 0, 0);
    var maxD = world.s / 2 - this.s / 2;
    
    if (d > maxD) {
        var ang = atan2(this.y, this.x);
        
        this.x = cos(ang) * maxD;
        this.y = sin(ang) * maxD;
        
        this.angOff = ang;
    }
};

if (typeof module !== "undefined" && module.exports) {
    module.exports = {
        Player: Player,
        Food: Food
    };
}
