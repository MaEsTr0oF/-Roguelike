class Game {
	constructor() {
		this.gameActive = false;
		this.showGameInstructions();
	}

	init() {
		this.field = new Field();
		this.player = new Player(this.field, this);
		this.enemies = []; 
		this.enemyAttackTimers = {}; 
		this.playerMoveTimer = null; 
		this.playerAttackTimer = null; 
		this.canPlayerMove = true; 
		this.canPlayerAttack = true; 
		this.enemyMoveInterval = null;
		this.enemyCheckInterval = null;
		this.gameActive = true;
		
		this.setupKeyboardControls(); 
		this.field.init();
		this.field.makeRooms();
		this.player.spawn(); 
		this.spawnEnemies(10);
		this.field.render();
		this.updateHealthDisplays();
		this.startEnemyAttackSystem();
		this.startEnemyMovementSystem();
	}
	
	showGameInstructions() {
		const instructions = `
			<div class="game-instructions">
				<h2>Инструкция к игре</h2>
				<p><strong>Управление:</strong></p>
				<ul>
					<li>Используйте клавиши <strong>WASD</strong> или <strong>стрелки</strong> для перемещения</li>
					<li>Нажмите <strong>Пробел</strong> для атаки противников вокруг вас</li>
				</ul>
				<p><strong>Предметы:</strong></p>
				<ul>
					<li><img src="images/tile-SW.png" width="20" height="20"> - Меч (увеличивает урон)</li>
					<li><img src="images/tile-HP.png" width="20" height="20"> - Зелье здоровья</li>
				</ul>
				<p><strong>Цель игры:</strong> Уничтожить всех противников и остаться в живых</p>
				<button id="start-game-btn">Начать игру</button>
			</div>
		`;
		
		const $modal = $('<div class="modal-overlay"></div>');
		$modal.html(instructions);
		$('body').append($modal);
		
		const style = `
			<style>
				.modal-overlay {
					position: fixed;
					top: 0;
					left: 0;
					width: 100%;
					height: 100%;
					background-color: rgba(0, 0, 0, 0.7);
					display: flex;
					justify-content: center;
					align-items: center;
					z-index: 1000;
				}
				.game-instructions {
					background-color: #f0f0f0;
					border-radius: 8px;
					padding: 20px;
					max-width: 500px;
					box-shadow: 0 0 15px rgba(0, 0, 0, 0.5);
					color: black;
				}
				.game-instructions h2 {
					text-align: center;
					margin-bottom: 15px;
					color: black;
				}
				.game-instructions p, .game-instructions ul, .game-instructions li {
					color: black;
				}
				.game-instructions ul {
					margin-bottom: 15px;
				}
				.game-instructions li {
					margin-bottom: 5px;
				}
				#start-game-btn {
					display: block;
					margin: 20px auto 0;
					padding: 10px 20px;
					background-color: #4CAF50;
					color: white;
					border: none;
					border-radius: 4px;
					font-size: 16px;
					cursor: pointer;
				}
				#start-game-btn:hover {
					background-color: #45a049;
				}
			</style>
		`;
		$('head').append(style);
		
		const self = this;
		$('#start-game-btn').on('click', function() {
			$modal.remove();
			self.init();
		});
	}
	
	startEnemyAttackSystem() {
		this.enemyCheckInterval = setInterval(() => {
			this.checkEnemiesNearPlayer();
		}, 100);
	}
	
	startEnemyMovementSystem() {
		this.enemyMoveInterval = setInterval(() => {
			this.moveEnemies();
		}, 2000);
	}
	
	checkEnemiesNearPlayer() {
		if (!this.gameActive) return;
		
		const attackRange = 1;
		
		for (let i = 0; i < this.enemies.length; i++) {
			const enemy = this.enemies[i];
			const enemyId = enemy.x + '-' + enemy.y;
			
			const dx = Math.abs(enemy.x - this.player.x);
			const dy = Math.abs(enemy.y - this.player.y);
			
			const inAttackRange = dx <= attackRange && dy <= attackRange && !(dx === 0 && dy === 0);
			
			if (inAttackRange) {
				if (!this.enemyAttackTimers[enemyId]) {
					this.addEffectToTile(enemy.x, enemy.y, 'preparing-attack');
					
					this.enemyAttackTimers[enemyId] = setTimeout(() => {
						this.enemyAttack(enemy);
						
						this.enemyAttackTimers[enemyId] = setInterval(() => {
							this.enemyAttack(enemy);
						}, 1000);
					}, 1000);
				}
			} else {
				if (this.enemyAttackTimers[enemyId]) {
					clearTimeout(this.enemyAttackTimers[enemyId]);
					clearInterval(this.enemyAttackTimers[enemyId]);
					this.enemyAttackTimers[enemyId] = null;
					this.removeEffectFromTile(enemy.x, enemy.y, 'preparing-attack');
				}
			}
		}
	}
	
	addEffectToTile(x, y, effect) {
		const tile = this.field.getTile(x, y);
		if (tile && tile.$element) {
			tile.$element.addClass(effect);
		}
	}
	
	removeEffectFromTile(x, y, effect) {
		const tile = this.field.getTile(x, y);
		if (tile && tile.$element) {
			tile.$element.removeClass(effect);
		}
	}
	
	enemyAttack(enemy) {
		if (!this.gameActive) return;
		
		const dx = Math.abs(enemy.x - this.player.x);
		const dy = Math.abs(enemy.y - this.player.y);
		
		if (dx <= 1 && dy <= 1 && !(dx === 0 && dy === 0)) {
			const damage = enemy.calculateDamage();
			
			this.player.takeDamage(damage);
			
			this.addEffectToTile(this.player.x, this.player.y, 'damage-animation');
			setTimeout(() => {
				this.removeEffectFromTile(this.player.x, this.player.y, 'damage-animation');
			}, 300);
			
			if (this.player.health <= 30) {
				this.addEffectToTile(this.player.x, this.player.y, 'low-health');
			} else {
				this.removeEffectFromTile(this.player.x, this.player.y, 'low-health');
			}
			
			this.updateHealthDisplays();
			
			if (this.player.health <= 0) {
				this.gameOver();
			}
		}
	}
	
	moveEnemies() {
		if (!this.gameActive) return;
		
		for (const enemy of this.enemies) {
			const dx = this.player.x - enemy.x;
			const dy = this.player.y - enemy.y;
			const distToPlayer = Math.sqrt(dx * dx + dy * dy);
			
			if (distToPlayer < 5 && Math.random() < 0.7) {
				let newX = enemy.x;
				let newY = enemy.y;
				
				if (Math.abs(dx) > Math.abs(dy)) {
					newX = enemy.x + (dx > 0 ? 1 : -1);
				} else {
					newY = enemy.y + (dy > 0 ? 1 : -1);
				}
				
				enemy.moveTo(newX, newY);
			} else {
				this.moveEnemyRandomly(enemy);
			}
		}
		
		this.render();
	}
	
	moveEnemyRandomly(enemy) {
		const direction = Math.floor(Math.random() * 4);
		let newX = enemy.x;
		let newY = enemy.y;
		
		switch(direction) {
			case 0: newY--; break;  
			case 1: newX++; break;  
			case 2: newY++; break;  
			case 3: newX--; break;  
		}
		
		enemy.moveTo(newX, newY);
	}
	
	gameOver() {
		this.stopGame();
		
		setTimeout(() => {
			alert('Игрок погиб! Игра окончена.');
			window.location.reload();
		}, 500);
	}
	
	victory() {
		this.stopGame();
		
		const healthPercent = Math.floor((this.player.health / this.player.maxHealth) * 100);
		const swordsCollected = this.player.swords;
		const damageOutput = this.player.calculateDamage();
		
		setTimeout(() => {
			alert(`Поздравляем! Вы победили всех противников!\n\nСтатистика:\n- Оставшееся здоровье: ${this.player.health}/${this.player.maxHealth} (${healthPercent}%)\n- Собрано мечей: ${swordsCollected}\n- Урон от атаки: ${damageOutput}`);
			
			if (confirm('Хотите начать новую игру?')) {
				window.location.reload();
			}
		}, 500);
	}
	
	stopGame() {
		this.gameActive = false;
		clearInterval(this.enemyCheckInterval);
		clearInterval(this.enemyMoveInterval);
		clearTimeout(this.playerMoveTimer);
		clearTimeout(this.playerAttackTimer);
		
		for (const timerId in this.enemyAttackTimers) {
			if (this.enemyAttackTimers[timerId]) {
				clearTimeout(this.enemyAttackTimers[timerId]);
				clearInterval(this.enemyAttackTimers[timerId]);
			}
		}
		
		$(document).off('keydown', this.handleKeyPress);
		this.clearAllAnimations();
	}
	
	clearAllAnimations() {
		for (const tile of this.field.tiles) {
			if (tile.$element) {
				tile.$element.removeClass('attack-animation damage-animation preparing-attack low-health');
			}
		}
	}
	
	render() {
		this.field.render();
		this.updateHealthDisplays();
	}
	
	setupKeyboardControls() {
		const self = this;
		this._handleKeyPressWrapper = function(event) {
			self.handleKeyPress(event);
		};
		$(document).off('keydown').on('keydown', this._handleKeyPressWrapper);
	}
	
	handleKeyPress(event) {
		if (!this.gameActive) return;
		
		const key = event.key.toLowerCase();
		
		if ((key === ' ' || key === 'spacebar')) {
			this.handlePlayerAttack();
			return;
		}
		
		if (this.canPlayerMove) {
			let direction = null;
			
			switch(key) {
				case 'w': case 'ц': case 'arrowup': direction = 'up'; break;
				case 'a': case 'ф': case 'arrowleft': direction = 'left'; break;
				case 's': case 'ы': case 'arrowdown': direction = 'down'; break;
				case 'd': case 'в': case 'arrowright': direction = 'right'; break;
				default: return;
			}
			
			if (direction) {
				this.handlePlayerMovementByDirection(direction);
			}
		}
	}
	
	handlePlayerMovementByDirection(direction) {
		let newX = this.player.x;
		let newY = this.player.y;
		
		switch(direction) {
			case 'up': newY--; break;
			case 'left': newX--; break;
			case 'down': newY++; break;
			case 'right': newX++; break;
		}
		
		if (this.player.moveTo(newX, newY)) {
			this.render();
			
			this.canPlayerMove = false;
			clearTimeout(this.playerMoveTimer);
			this.playerMoveTimer = setTimeout(() => {
				this.canPlayerMove = true;
			}, 200);
		}
	}
	
	handlePlayerAttack() {
		if (!this.canPlayerAttack) return;
		
		this.player.attackEnemiesAround();
		this.render();
		
		this.canPlayerAttack = false;
		clearTimeout(this.playerAttackTimer);
		this.playerAttackTimer = setTimeout(() => {
			this.canPlayerAttack = true;
		}, 1000);
	}
	
	spawnEnemies(count) {
		this.enemies = [];
		
		const roomTiles = this.field.findTilesOfType('room');
		if (roomTiles.length === 0) return;
		
		roomTiles.sort(() => Math.random() - 0.5);
		const enemiesCount = Math.min(count, roomTiles.length);
		
		for (let i = 0; i < enemiesCount; i++) {
			const {x, y} = roomTiles.pop();
			const enemy = new Enemy(this.field, x, y);
			this.enemies.push(enemy);
			this.field.setTileType(x, y, 'enemy');
		}
	}
	
	updateHealthDisplays() {
		const playerTile = this.field.getTile(this.player.x, this.player.y);
		if (playerTile && playerTile.$element) {
			const healthPercent = (this.player.health / this.player.maxHealth) * 100;
			playerTile.$element.css('--health-percent', healthPercent + '%');
			
			if (this.player.health <= 30) {
				playerTile.$element.addClass('low-health');
			} else {
				playerTile.$element.removeClass('low-health');
			}
		}
		
		for (const enemy of this.enemies) {
			const enemyTile = this.field.getTile(enemy.x, enemy.y);
			if (enemyTile && enemyTile.$element) {
				const healthPercent = (enemy.health / enemy.maxHealth) * 100;
				enemyTile.$element.css('--health-percent', healthPercent + '%');
			}
		}
	}
}

class Character {
	constructor(field, x, y, health = 100) {
		this.field = field;
		this.x = x;
		this.y = y;
		this.health = health;
		this.maxHealth = health;
	}
	
	moveTo(x, y) {
		const tile = this.field.getTile(x, y);
		
		if (!tile || tile.type === 'wall') {
			return false;
		}
		
		const oldX = this.x;
		const oldY = this.y;
		
		this.x = x;
		this.y = y;
		
		return true;
	}
	
	takeDamage(amount) {
		this.health -= amount;
		if (this.health < 0) this.health = 0;
		return this.health > 0;
	}
	
	calculateDamage() {
		return 0;
	}
}

class Player extends Character {
	constructor(field, game) {
		super(field, 0, 0, 100);
		this.game = game;
		this.swords = 0;
		this.damage = 15;
	}
	
	spawn() {
		const roomTiles = this.field.findTilesOfType('room');
		if (roomTiles.length === 0) return false;
		
		const randomIndex = Math.floor(Math.random() * roomTiles.length);
		const {x, y} = roomTiles[randomIndex];
		
		this.x = x;
		this.y = y;
		this.field.setTileType(x, y, 'player');
		
		return true;
	}
	
	moveTo(x, y) {
		const tile = this.field.getTile(x, y);
		
		if (!tile || tile.type === 'wall') return false;
		
		const oldX = this.x;
		const oldY = this.y;
		
		if (tile.type === 'sword') {
			this.swords++;
		} else if (tile.type === 'health') {
			const healAmount = 25;
			this.health = Math.min(this.maxHealth, this.health + healAmount);
		} else if (tile.type === 'enemy') {
			return false;
		}
		
		this.x = x;
		this.y = y;
		
		this.field.setTileType(oldX, oldY, 'room');
		this.field.setTileType(x, y, 'player');
		
		return true;
	}
	
	attackEnemiesAround() {
		const attackRange = 1;
		let enemiesAttacked = 0;
		const animatedTiles = [];
		
		for (let dx = -attackRange; dx <= attackRange; dx++) {
			for (let dy = -attackRange; dy <= attackRange; dy++) {
				if (dx === 0 && dy === 0) continue;
				
				const targetX = this.x + dx;
				const targetY = this.y + dy;
				const tile = this.field.getTile(targetX, targetY);
				
				if (tile && tile.type === 'room' && tile.$element) {
					tile.$element.addClass('attack-animation');
					animatedTiles.push(tile.$element);
				}
				
				if (tile && tile.type === 'enemy') {
					const enemyIndex = this.findEnemyAt(targetX, targetY);
					
					if (enemyIndex !== -1) {
						const damageDealt = this.calculateDamage();
						const enemy = this.game.enemies[enemyIndex];
						const isAlive = enemy.takeDamage(damageDealt);
						
						if (!isAlive) {
							this.game.enemies.splice(enemyIndex, 1);
							
							const enemyId = targetX + '-' + targetY;
							if (this.game.enemyAttackTimers[enemyId]) {
								clearTimeout(this.game.enemyAttackTimers[enemyId]);
								clearInterval(this.game.enemyAttackTimers[enemyId]);
								this.game.enemyAttackTimers[enemyId] = null;
							}
							
							if (tile.$element) {
								tile.$element.removeClass('preparing-attack damage-animation');
							}
							
							this.field.setTileType(targetX, targetY, 'room');
							
							if (this.game.enemies.length === 0) {
								this.game.victory();
							}
						} else {
							const enemyTile = this.field.getTile(targetX, targetY);
							if (enemyTile && enemyTile.$element) {
								const healthPercent = (enemy.health / enemy.maxHealth) * 100;
								enemyTile.$element.css('--health-percent', healthPercent + '%');
								
								enemyTile.$element.addClass('damage-animation');
								setTimeout(() => {
									enemyTile.$element.removeClass('damage-animation');
								}, 300);
							}
						}
						
						enemiesAttacked++;
					}
				}
			}
		}
		
		setTimeout(() => {
			animatedTiles.forEach($tile => {
				$tile.removeClass('attack-animation');
			});
		}, 300);
		
		return enemiesAttacked;
	}
	
	findEnemyAt(x, y) {
		for (let i = 0; i < this.game.enemies.length; i++) {
			const enemy = this.game.enemies[i];
			if (enemy.x === x && enemy.y === y) {
				return i;
			}
		}
		return -1;
	}
	
	calculateDamage() {
		return this.damage + (this.swords * 20);
	}
	
	takeDamage(amount) {
		return super.takeDamage(amount);
	}
}

class Enemy extends Character {
	constructor(field, x, y) {
		super(field, x, y, 200);
		this.damage = 10;
	}
	
	moveTo(x, y) {
		const tile = this.field.getTile(x, y);
		
		if (!tile || tile.type === 'wall' || tile.type === 'player' || tile.type === 'enemy' || 
			tile.type === 'sword' || tile.type === 'health') {
			return false;
		}
		
		const oldX = this.x;
		const oldY = this.y;
		
		this.x = x;
		this.y = y;
		
		this.field.setTileType(oldX, oldY, 'room');
		this.field.setTileType(x, y, 'enemy');
		
		return true;
	}
	
	calculateDamage() {
		const randomFactor = Math.random() * 1.5 + 0.8;
		return Math.floor(this.damage * randomFactor);
	}
}

class Field {
	constructor() {
		this.tiles = [];
		this.$element = $('.field');
		this.width = 40;
		this.height = 24;
		this.tileSize = 40;
		this.rooms = [];
	}
	
	Tile = class {
		constructor(x, y, type, field) {
			this.x = x;
			this.y = y;
			this.type = type;
			this.field = field;
			this.$element = null;
		}
		
		render() {
			if (!this.$element) {
				this.$element = $('<div class="tile"></div>');
				this.updateAppearance();
				this.$element.css({
					left: this.x * this.field.tileSize + 'px',
					top: this.y * this.field.tileSize + 'px',
					width: this.field.tileSize + 'px',
					height: this.field.tileSize + 'px'
				});
			} else {
				this.updateAppearance();
			}
			return this.$element;
		}
		
		updateAppearance() {
			this.$element.removeClass('tileW tileP tileSW tileHP tileE preparing-attack damage-animation low-health');
			
			switch(this.type) {
				case 'wall':
					this.$element.addClass('tileW');
					this.$element.css('background-image', 'url(images/tile-W.png)');
					break;
				case 'room':
					this.$element.css('background-image', 'url(images/tile-.png)');
					break;
				case 'sword':
					this.$element.addClass('tileSW');
					this.$element.css('background-image', 'url(images/tile-SW.png)');
					break;
				case 'health':
					this.$element.addClass('tileHP');
					this.$element.css('background-image', 'url(images/tile-HP.png)');
					break;
				case 'player':
					this.$element.addClass('tileP');
					this.$element.css('background-image', 'url(images/tile-P.png)');
					break;
				case 'enemy':
					this.$element.addClass('tileE');
					this.$element.css('background-image', 'url(images/tile-E.png)');
					break;
			}
		}
	}
	
	init() {
		for (let j = 0; j < this.height; j++) {
			for (let i = 0; i < this.width; i++) {
				this.tiles.push(new this.Tile(i, j, 'wall', this));
			}
		}
	}

	getTile(x, y) {
		if (x < 0 || x >= this.width || y < 0 || y >= this.height) return null;
		return this.tiles[y * this.width + x];
	}

	setTileType(x, y, type) {
		const tile = this.getTile(x, y);
		if (tile) {
			tile.type = type;
			
			if (type === 'room' && tile.$element) {
				tile.$element.removeClass('preparing-attack damage-animation low-health');
				tile.$element.css('--health-percent', '');
			}
			
			if (tile.$element) {
				tile.render();
			}
		}
	}

	canPlaceRoom(x, y, size) {
		if (x < 1 || x + size + 1 >= this.width || y < 1 || y + size + 1 >= this.height) {
			return false;
		}
		for (let i = x - 1; i <= x + size; i++) {
			for (let j = y - 1; j <= y + size; j++) {
				const tile = this.getTile(i, j);
				if (!tile || tile.type !== 'wall') {
					return false;
				}
			}
		}
		return true;
	}

	createRoom(x, y, size) {
		for (let i = x - 1; i <= x + size; i++) {
			this.setTileType(i, y - 1, 'wall');
			this.setTileType(i, y + size, 'wall');
		}
		for (let j = y - 1; j <= y + size; j++) {
			this.setTileType(x - 1, j, 'wall');
			this.setTileType(x + size, j, 'wall');
		}

		for (let i = x; i < x + size; i++) {
			for (let j = y; j < y + size; j++) {
				this.setTileType(i, j, 'room');
			}
		}
		
		this.rooms.push({
			x: x,
			y: y,
			size: size,
			centerX: Math.floor(x + size/2),
			centerY: Math.floor(y + size/2)
		});
	}

	makeRooms() {
		const numRooms = Math.floor(Math.random() * 6) + 5;
		let roomsCreated = 0;
		
		this.rooms = [];
		
		let attempts = 0;
		const maxAttempts = 1000;
		
		while (roomsCreated < numRooms && attempts < maxAttempts) {
			const size = Math.floor(Math.random() * 6) + 3;
			const x = Math.floor(Math.random() * (this.width - size - 2)) + 1;
			const y = Math.floor(Math.random() * (this.height - size - 2)) + 1;
			
			if (this.canPlaceRoom(x, y, size)) {
				this.createRoom(x, y, size);
				roomsCreated++;
			}
			
			attempts++;
		}
		
		if (this.rooms.length > 1) {
			this.connectAllRooms();
		}
		
		this.placeItems();
	}
	
	connectAllRooms() {
		const connectedRooms = new Set([0]);
		
		while (connectedRooms.size < this.rooms.length) {
			let minDistance = Infinity;
			let bestPair = null;
		 
			for (const connectedIdx of connectedRooms) {
				const connectedRoom = this.rooms[connectedIdx];
				
				for (let i = 0; i < this.rooms.length; i++) {
					if (connectedRooms.has(i)) continue;
					
					const room = this.rooms[i];
					const distance = Math.abs(connectedRoom.centerX - room.centerX) + 
								   Math.abs(connectedRoom.centerY - room.centerY);
					
					if (distance < minDistance) {
						minDistance = distance;
						bestPair = [connectedRoom, room];
					}
				}
			}
			
			if (bestPair) {
				this.createCorridor(bestPair[0], bestPair[1]);
				const roomIdx = this.rooms.indexOf(bestPair[1]);
				connectedRooms.add(roomIdx);
			} else {
				break;
			}
		}
		
		const extraCorridors = Math.floor(Math.random() * 3) + 1;
		for (let i = 0; i < extraCorridors; i++) {
			const room1 = this.rooms[Math.floor(Math.random() * this.rooms.length)];
			const room2 = this.rooms[Math.floor(Math.random() * this.rooms.length)];
			
			if (room1 !== room2) {
				this.createCorridor(room1, room2);
			}
		}
	}
	
	createCorridor(room1, room2) {
		const startX = room1.centerX;
		const startY = room1.centerY;
		const endX = room2.centerX;
		const endY = room2.centerY;
		
		let x = startX;
		while (x !== endX) {
			this.setTileType(x, startY, 'room');
			x += (x < endX) ? 1 : -1;
		}
		
		let y = startY;
		while (y !== endY) {
			this.setTileType(endX, y, 'room');
			y += (y < endY) ? 1 : -1;
		}
	}
	
	findTilesOfType(type) {
		const result = [];
		for (let y = 0; y < this.height; y++) {
			for (let x = 0; x < this.width; x++) {
				const tile = this.getTile(x, y);
				if (tile && tile.type === type) {
					result.push({x, y});
				}
			}
		}
		return result;
	}
	
	placeItems() {
		const roomTiles = this.findTilesOfType('room');
		if (roomTiles.length === 0) return;
		
		roomTiles.sort(() => Math.random() - 0.5);
		
		const swordsCount = Math.min(2, roomTiles.length);
		for (let i = 0; i < swordsCount; i++) {
			const {x, y} = roomTiles.pop();
			this.setTileType(x, y, 'sword');
		}
		
		const healthCount = Math.min(10, roomTiles.length);
		for (let i = 0; i < healthCount; i++) {
			const {x, y} = roomTiles.pop();
			this.setTileType(x, y, 'health');
		}
	}

	render() {
		this.$element.empty();
		for (const tile of this.tiles) {
			this.$element.append(tile.render());
		}
	}
}


