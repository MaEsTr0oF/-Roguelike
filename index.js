class Game {
	constructor() {
		this.field = new Field();
		this.player = new Player(this.field, this);
		this.enemies = []; 
		this.enemyAttackTimers = {}; 
		this.playerMoveTimer = null; 
		this.playerAttackTimer = null; 
		this.canPlayerMove = true; 
		this.canPlayerAttack = true; 
		this.enemyMoveInterval = null; 
		this.setupKeyboardControls(); 
	}
	init() {
		this.field.init();
		this.field.makeRooms();
		this.player.spawn(); 
		this.spawnEnemies(10);  
		this.field.render();
		 
		this.updateHealthDisplays();
		
		 
		this.startEnemyAttackSystem();
		
		 
		this.startEnemyMovementSystem();
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
		const attackRange = 1;  
		
		 
		for (let i = 0; i < this.enemies.length; i++) {
			const enemy = this.enemies[i];
			const enemyId = enemy.x + '-' + enemy.y;  
			
			 
			const dx = Math.abs(enemy.x - this.player.x);
			const dy = Math.abs(enemy.y - this.player.y);
			
			
			if (dx <= attackRange && dy <= attackRange && !(dx === 0 && dy === 0)) {
				
				if (!this.enemyAttackTimers[enemyId]) {
					console.log(`Противник на (${enemy.x}, ${enemy.y}) готовится атаковать игрока!`);
					
					
					const enemyTile = this.field.getTile(enemy.x, enemy.y);
					if (enemyTile && enemyTile.$element) {
						enemyTile.$element.addClass('preparing-attack');
					}
					
					
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
					
					
					const enemyTile = this.field.getTile(enemy.x, enemy.y);
					if (enemyTile && enemyTile.$element) {
						enemyTile.$element.removeClass('preparing-attack');
					}
				}
			}
		}
	}
	
	 
	enemyAttack(enemy) {
		 
		const dx = Math.abs(enemy.x - this.player.x);
		const dy = Math.abs(enemy.y - this.player.y);
		
		if (dx <= 1 && dy <= 1 && !(dx === 0 && dy === 0)) {
			 
			const damage = enemy.calculateDamage();
			
			 
			this.player.takeDamage(damage);
			
			 
			const playerTile = this.field.getTile(this.player.x, this.player.y);
			if (playerTile && playerTile.$element) {
				playerTile.$element.addClass('damage-animation');
				setTimeout(() => {
					playerTile.$element.removeClass('damage-animation');
				}, 300);
				
				 
				if (this.player.health <= 30) {
					playerTile.$element.addClass('low-health');
				} else {
					playerTile.$element.removeClass('low-health');
				}
			}
			
			console.log(`Противник на (${enemy.x}, ${enemy.y}) атаковал игрока и нанес ${damage} урона!`);
			
			 
			this.updateHealthDisplays();
			
			 
			if (this.player.health <= 0) {
				console.log('Игрок погиб!');
				this.gameOver();
			}
		}
	}
	
	 
	moveEnemies() {
		for (let i = 0; i < this.enemies.length; i++) {
			const enemy = this.enemies[i];
			
			 
			 
			 
			
			 
			const dx = this.player.x - enemy.x;
			const dy = this.player.y - enemy.y;
			const distToPlayer = Math.sqrt(dx * dx + dy * dy);
			
			let newX = enemy.x;
			let newY = enemy.y;
			
			 
			if (distToPlayer < 5) {
				 
				if (Math.random() < 0.7) {
					 
					if (Math.abs(dx) > Math.abs(dy)) {
						 
						newX = enemy.x + (dx > 0 ? 1 : -1);
					} else {
						 
						newY = enemy.y + (dy > 0 ? 1 : -1);
					}
				} else {
					 
					this.moveEnemyRandomly(enemy);
					continue;
				}
			} else {
				 
				this.moveEnemyRandomly(enemy);
				continue;
			}
			
			 
			if (enemy.moveTo(newX, newY)) {
				console.log(`Противник перемещен на (${newX}, ${newY})`);
			}
		}
		
		 
		this.render();
	}
	
	 
	moveEnemyRandomly(enemy) {
		 
		const direction = Math.floor(Math.random() * 4);  
		
		let newX = enemy.x;
		let newY = enemy.y;
		
		switch(direction) {
			case 0:  
				newY--;
				break;
			case 1:  
				newX++;
				break;
			case 2:  
				newY++;
				break;
			case 3:  
				newX--;
				break;
		}
		
		 
		if (enemy.moveTo(newX, newY)) {
			console.log(`Противник случайно перемещен на (${newX}, ${newY})`);
		}
	}
	
	 
	gameOver() {
		 
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
		
		 
		setTimeout(() => {
			 
			alert('Игрок погиб! Игра окончена.');
			
			 
			window.location.reload();
		}, 500);  
	}
	
	 
	victory() {
		 
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
	
	 
	clearAllAnimations() {
		 
		for (let i = 0; i < this.field.tiles.length; i++) {
			const tile = this.field.tiles[i];
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
		console.log('Настройка управления клавиатурой');
		
		 
		this.handleKeyPress = this.handleKeyPress.bind(this);
		
		 
		$(document).on('keydown', this.handleKeyPress);
	}
	
	 
	handleKeyPress(event) {
		 
		const key = event.key.toLowerCase();
		
		 
		if ((key === ' ' || key === 'spacebar') && this.canPlayerAttack) {
			console.log('Игрок атакует!');
			this.player.attackEnemiesAround();
			 
			this.render();
			
			 
			this.canPlayerAttack = false;
			clearTimeout(this.playerAttackTimer);
			this.playerAttackTimer = setTimeout(() => {
				this.canPlayerAttack = true;
				console.log('Игрок снова может атаковать');
			}, 1000);
			
			return;
		} else if ((key === ' ' || key === 'spacebar') && !this.canPlayerAttack) {
			console.log('Атака еще на перезарядке!');
			return;
		}
		
		 
		if (!this.canPlayerMove) {
			console.log('Передвижение на перезарядке!');
			return;
		}
		
		 
		let newX = this.player.x;
		let newY = this.player.y;
		
		 
		switch(key) {
			case 'w':  
				newY--;
				break;
			case 'a':  
				newX--;
				break;
			case 's':  
				newY++;
				break;
			case 'd':  
				newX++;
				break;
			default:
				 
				return;
		}
		
		 
		if (this.player.moveTo(newX, newY)) {
			console.log(`Игрок перемещен на (${newX}, ${newY}) клавишей ${key.toUpperCase()}`);
			
			 
			this.render();
			
			 
			this.canPlayerMove = false;
			clearTimeout(this.playerMoveTimer);
			this.playerMoveTimer = setTimeout(() => {
				this.canPlayerMove = true;
				console.log('Игрок снова может двигаться');
			}, 200);
		}
	}
	
	 
	spawnEnemies(count) {
		console.log(`Размещаем ${count} противников`);
		
		 
		this.enemies = [];
		
		 
		const roomTiles = [];
		for (let y = 0; y < this.field.height; y++) {
			for (let x = 0; x < this.field.width; x++) {
				const tile = this.field.getTile(x, y);
				if (tile && tile.type === 'room') {
					roomTiles.push({x, y});
				}
			}
		}
		
		 
		if (roomTiles.length === 0) {
			console.log('Нет доступных тайлов для размещения противников');
			return;
		}
		
		 
		roomTiles.sort(() => Math.random() - 0.5);
		
		 
		const enemiesCount = Math.min(count, roomTiles.length);
		
		for (let i = 0; i < enemiesCount; i++) {
			const {x, y} = roomTiles.pop();
			
			 
			const enemy = new Enemy(this.field, x, y);
			this.enemies.push(enemy);
			
			 
			this.field.setTileType(x, y, 'enemy');
			
			console.log(`Противник ${i+1} размещен на x=${x}, y=${y}`);
		}
		
		console.log(`Размещено ${this.enemies.length} противников`);
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

class Player {
	constructor(field, game) {
		this.field = field;
		this.game = game;  
		this.x = 0;
		this.y = 0;
		this.health = 100;
		this.maxHealth = 100;
		this.swords = 0;
		this.damage = 25;  
	}
	
	 
	spawn() {
		 
		const roomTiles = [];
		for (let y = 0; y < this.field.height; y++) {
			for (let x = 0; x < this.field.width; x++) {
				const tile = this.field.getTile(x, y);
				if (tile && tile.type === 'room') {
					roomTiles.push({x, y});
				}
			}
		}
		
		 
		if (roomTiles.length === 0) {
			console.log('Нет доступных тайлов для размещения игрока');
			return false;
		}
		
		 
		const randomIndex = Math.floor(Math.random() * roomTiles.length);
		const {x, y} = roomTiles[randomIndex];
		
		 
		this.x = x;
		this.y = y;
		
		 
		this.field.setTileType(x, y, 'player');
		
		console.log(`Игрок размещен на x=${x}, y=${y}`);
		return true;
	}
	
	 
	moveTo(x, y) {
		 
		const tile = this.field.getTile(x, y);
		
		 
		if (!tile || tile.type === 'wall') {
			console.log(`Невозможно переместиться на x=${x}, y=${y}`);
			return false;
		}
		
		 
		const oldX = this.x;
		const oldY = this.y;
		
		 
		if (tile.type === 'sword') {
			 
			console.log('Игрок подобрал меч!');
			this.swords++;
			
			 
			console.log(`Сила удара увеличена до ${this.calculateDamage()}`);
		} else if (tile.type === 'health') {
			 
			const healAmount = 25;
			const oldHealth = this.health;
			this.health = Math.min(this.maxHealth, this.health + healAmount);
			const actualHeal = this.health - oldHealth;
			
			console.log(`Игрок подобрал зелье здоровья! Восстановлено ${actualHeal} здоровья. Текущее здоровье: ${this.health}/${this.maxHealth}`);
		} else if (tile.type === 'enemy') {
			console.log('Игрок не может переместиться на клетку с противником!');
			return false;  
		}
		
		 
		this.x = x;
		this.y = y;
		
		 
		this.field.setTileType(oldX, oldY, 'room');
		this.field.setTileType(x, y, 'player');
		
		console.log(`Игрок перемещен с (${oldX},${oldY}) на (${x},${y})`);
		return true;
	}
	
	 
	attackEnemiesAround() {
		const attackRange = 1;  
		let enemiesAttacked = 0;
		
		 
		const animatedTiles = [];
		
		 
		for (let dx = -attackRange; dx <= attackRange; dx++) {
			for (let dy = -attackRange; dy <= attackRange; dy++) {
				 
				if (dx === 0 && dy === 0) {
					continue;
				}
				
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
						const isKilled = enemy.takeDamage(damageDealt);
						
						console.log(`Игрок атаковал противника на (${targetX}, ${targetY}) и нанес ${damageDealt} урона!`);
						
						if (isKilled) {
							 
							this.game.enemies.splice(enemyIndex, 1);
							
							 
							const enemyId = targetX + '-' + targetY;
							if (this.game.enemyAttackTimers[enemyId]) {
								clearTimeout(this.game.enemyAttackTimers[enemyId]);
								clearInterval(this.game.enemyAttackTimers[enemyId]);
								this.game.enemyAttackTimers[enemyId] = null;
								console.log(`Очищен таймер атаки для противника на (${targetX}, ${targetY})`);
							}
							
							 
							if (tile.$element) {
								tile.$element.removeClass('preparing-attack damage-animation');
								console.log(`Удалены все эффекты для тайла (${targetX}, ${targetY})`);
							}
							
							 
							this.field.setTileType(targetX, targetY, 'room');
							console.log(`Противник на (${targetX}, ${targetY}) убит!`);
							
							 
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
		
		if (enemiesAttacked > 0) {
			console.log(`Игрок атаковал ${enemiesAttacked} противников`);
		} else {
			console.log('Рядом нет противников для атаки');
		}
		
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
		 
		return this.damage + (this.swords * 25);
	}
	
	 
	takeDamage(amount) {
		 
		this.health -= amount;
		
		 
		if (this.health < 0) {
			this.health = 0;
		}
		
		console.log(`Игрок получил ${amount} урона. Осталось здоровья: ${this.health}/${this.maxHealth}`);
		
		 
		return this.health > 0;
	}
}

class Field {
	constructor() {
		console.log('Field constructor');
		this.tiles = [];
		this.$element = $('.field');
		this.width = 40;
		this.height = 24;
		this.tileSize = 40;  
		this.rooms = [];  
		console.log('Field element:', this.$element.length ? 'found' : 'not found');
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
				if (this.type === 'wall') {
					this.$element.addClass('tileW');
				}
				if (this.type === 'room') {
					 
					this.$element.removeClass('tileW');
					 
					this.$element.css('background-image', 'url(images/tile-.png)');
				}
				if (this.type === 'sword') {
					 
					this.$element.removeClass('tileW');
					this.$element.addClass('tileSW');
					this.$element.css('background-image', 'url(images/tile-SW.png)');
				}
				if (this.type === 'health') {
					 
					this.$element.removeClass('tileW');
					this.$element.addClass('tileHP');
					this.$element.css('background-image', 'url(images/tile-HP.png)');
				}
				if (this.type === 'player') {
					 
					this.$element.removeClass('tileW');
					this.$element.addClass('tileP');
					this.$element.css('background-image', 'url(images/tile-P.png)');
				}
				if (this.type === 'enemy') {
					 
					this.$element.removeClass('tileW');
					this.$element.addClass('tileE');
					this.$element.css('background-image', 'url(images/tile-E.png)');
				}
				this.$element.css({
					left: this.x * this.field.tileSize + 'px',
					top: this.y * this.field.tileSize + 'px',
					width: this.field.tileSize + 'px',
					height: this.field.tileSize + 'px'
				});
			} else {
				 
				if (this.type === 'wall') {
					this.$element.removeClass('tileP tileSW tileHP tileE preparing-attack damage-animation low-health').addClass('tileW').css('background-image', 'url(images/tile-W.png)');
				}
				if (this.type === 'room') {
					this.$element.removeClass('tileW tileP tileSW tileHP tileE preparing-attack damage-animation low-health').css('background-image', 'url(images/tile-.png)');
				}
				if (this.type === 'sword') {
					this.$element.removeClass('tileW tileP tileHP tileE preparing-attack damage-animation low-health').addClass('tileSW').css('background-image', 'url(images/tile-SW.png)');
				}
				if (this.type === 'health') {
					this.$element.removeClass('tileW tileP tileSW tileE preparing-attack damage-animation low-health').addClass('tileHP').css('background-image', 'url(images/tile-HP.png)');
				}
				if (this.type === 'player') {
					this.$element.removeClass('tileW tileSW tileHP tileE preparing-attack damage-animation').addClass('tileP').css('background-image', 'url(images/tile-P.png)');
				}
				if (this.type === 'enemy') {
					this.$element.removeClass('tileW tileP tileSW tileHP low-health').addClass('tileE').css('background-image', 'url(images/tile-E.png)');
				}
			}
			return this.$element;
		}
	}
	
	init() {
		console.log('Field init');
		for (let j = 0; j < this.height; j++) {
			 for (let i = 0; i < this.width; i++) {
				  this.tiles.push(new this.Tile(i, j, 'wall', this));
			 }
		}
		console.log('Created tiles:', this.tiles.length);
  }

	getTile(x, y) {
		if (x < 0 || x >= this.width || y < 0 || y >= this.height) return null;
		return this.tiles[y * this.width + x];
	}

	setTileType(x, y, type) {
		const tile = this.getTile(x, y);
		if (tile) {
			const oldType = tile.type;
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
			console.log(`Комната не помещается: x=${x}, y=${y}, size=${size}, width=${this.width}, height=${this.height}`);
			return false;
		}
		for (let i = x - 1; i <= x + size; i++) {
			for (let j = y - 1; j <= y + size; j++) {
				const tile = this.getTile(i, j);
				if (!tile || tile.type !== 'wall') {
					console.log(`Конфликт с существующей комнатой: x=${i}, y=${j}`);
					return false;
				}
			}
		}
		return true;
	}

	createRoom(x, y, size) {
		console.log('Creating room at:', x, y, 'size:', size);

		console.log('Стены комнаты:');
		console.log(`Верхняя стена: x=${x-1}..${x+size}, y=${y-1}`);
		console.log(`Нижняя стена: x=${x-1}..${x+size}, y=${y+size}`);
		console.log(`Левая стена: x=${x-1}, y=${y-1}..${y+size}`);
		console.log(`Правая стена: x=${x+size}, y=${y-1}..${y+size}`);
		
		 
		for (let i = x - 1; i <= x + size; i++) {
			this.setTileType(i, y - 1, 'wall');   
			this.setTileType(i, y + size, 'wall');  
		}
		for (let j = y - 1; j <= y + size; j++) {
			this.setTileType(x - 1, j, 'wall');   
			this.setTileType(x + size, j, 'wall');  
		}

		 
		console.log('Тайлы комнаты:');
		for (let i = x; i < x + size; i++) {
			for (let j = y; j < y + size; j++) {
				console.log(`Тайл комнаты: x=${i}, y=${j}`);
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
		
		console.log('Room created at:', x, y, 'size:', size);
	}

	makeRooms() {
		 
		const numRooms = Math.floor(Math.random() * 6) + 5;
		let roomsCreated = 0;
		
		 
		this.rooms = [];
		
		console.log(`Пытаемся создать ${numRooms} комнат`);
		
		let cnt = 0;
		while (roomsCreated < numRooms) {
			  
			 const size = Math.floor(Math.random() * 6) + 3;
			 
			 const findX = () => {
				  return Math.floor(Math.random() * (this.width - size - 2)) + 1;
			 }
			 
			 const findY = () => {
				  return Math.floor(Math.random() * (this.height - size - 2)) + 1;
			 }
			 
			 let x = findX();
			 let y = findY();
			 
			 if (this.canPlaceRoom(x, y, size)) {
				  this.createRoom(x, y, size);
				  roomsCreated++;
				  console.log(`Комната ${roomsCreated}/${numRooms} создана: x=${x}, y=${y}, размер=${size}`);
			 }
			 
			 cnt++;
			 if (cnt > 1000) break;  
		}
		
		console.log(`Всего создано комнат: ${roomsCreated} из ${numRooms}`);
		
		 
		this.createGridLines();
		
		 
		this.placeItems();
  }
	
	 
	createGridLines() {
		if (this.rooms.length === 0) {
			console.log('Нет комнат для соединения линиями');
			return;
		}
		
		 
		const numHorizontalLines = Math.floor(Math.random() * 3) + 3;  
		const numVerticalLines = Math.floor(Math.random() * 3) + 3;  
		
		console.log(`Создаем ${numHorizontalLines} горизонтальных и ${numVerticalLines} вертикальных линий`);
		
		 
		let minX = this.width;
		let maxX = 0;
		let minY = this.height;
		let maxY = 0;
		
		for (const room of this.rooms) {
			minX = Math.min(minX, room.x);
			maxX = Math.max(maxX, room.x + room.size);
			minY = Math.min(minY, room.y);
			maxY = Math.max(maxY, room.y + room.size);
		}
		
		console.log(`Границы области комнат: x=${minX}..${maxX}, y=${minY}..${maxY}`);
		
		 
		const yStep = Math.max(1, Math.floor((maxY - minY) / (numHorizontalLines + 1)));
		for (let i = 1; i <= numHorizontalLines; i++) {
			const y = Math.min(this.height - 1, Math.floor(minY + i * yStep));
			this.createHorizontalLine(y);
		}
		
		 
		const xStep = Math.max(1, Math.floor((maxX - minX) / (numVerticalLines + 1)));
		for (let i = 1; i <= numVerticalLines; i++) {
			const x = Math.min(this.width - 1, Math.floor(minX + i * xStep));
			this.createVerticalLine(x);
		}
	}

	 
	createHorizontalLine(y) {
		if (y < 0 || y >= this.height) return;
		
		console.log(`Создаем горизонтальную линию на y=${y}`);
		
		for (let x = 0; x < this.width; x++) {
			 
			this.setTileType(x, y, 'room');
		}
	}

	 
	createVerticalLine(x) {
		if (x < 0 || x >= this.width) return;
		
		console.log(`Создаем вертикальную линию на x=${x}`);
		
		for (let y = 0; y < this.height; y++) {
			 
			this.setTileType(x, y, 'room');
		}
	}
	
	 
	isRoomWall(x, y) {
		 
		for (const room of this.rooms) {
			 
			if (y === room.y - 1 && x >= room.x - 1 && x <= room.x + room.size) {
				return true;
			}
			 
			if (y === room.y + room.size && x >= room.x - 1 && x <= room.x + room.size) {
				return true;
			}
			 
			if (x === room.x - 1 && y >= room.y - 1 && y <= room.y + room.size) {
				return true;
			}
			 
			if (x === room.x + room.size && y >= room.y - 1 && y <= room.y + room.size) {
				return true;
			}
		}
		return false;
	}

	 
	placeItems() {
		 
		const roomTiles = [];
		for (let y = 0; y < this.height; y++) {
			for (let x = 0; x < this.width; x++) {
				const tile = this.getTile(x, y);
				if (tile && tile.type === 'room') {
					roomTiles.push({x, y});
				}
			}
		}
		
		 
		if (roomTiles.length === 0) {
			console.log('Нет доступных тайлов для размещения предметов');
			return;
		}
		
		console.log(`Доступно ${roomTiles.length} тайлов для размещения предметов`);
		
		 
		roomTiles.sort(() => Math.random() - 0.5);
		
		 
		const swordsCount = Math.min(2, roomTiles.length);
		for (let i = 0; i < swordsCount; i++) {
			const {x, y} = roomTiles.pop();
			this.setTileType(x, y, 'sword');
			console.log(`Меч ${i+1} размещен на x=${x}, y=${y}`);
		}
		
		 
		const healthCount = Math.min(10, roomTiles.length);
		for (let i = 0; i < healthCount; i++) {
			const {x, y} = roomTiles.pop();
			this.setTileType(x, y, 'health');
			console.log(`Зелье здоровья ${i+1} размещено на x=${x}, y=${y}`);
		}
		
		console.log(`Размещено ${swordsCount} мечей и ${healthCount} зелий здоровья`);
	}

	render() {
		console.log('Field render');
		this.$element.empty();
		let wallCount = 0;
		let roomCount = 0;
		let swordCount = 0;
		let healthCount = 0;
		let playerCount = 0;
		let enemyCount = 0;
		
		for (let i = 0; i < this.tiles.length; i++) {
			 if (this.tiles[i].type === 'wall') wallCount++;
			 if (this.tiles[i].type === 'room') roomCount++;
			 if (this.tiles[i].type === 'sword') swordCount++;
			 if (this.tiles[i].type === 'health') healthCount++;
			 if (this.tiles[i].type === 'player') playerCount++;
			 if (this.tiles[i].type === 'enemy') enemyCount++;
			 this.$element.append(this.tiles[i].render());
		}
		
		console.log('Rendered tiles:', this.$element.children().length);
		console.log('Wall tiles:', wallCount);
		console.log('Room tiles:', roomCount);
		console.log('Sword tiles:', swordCount);
		console.log('Health tiles:', healthCount);
		console.log('Player tiles:', playerCount);
		console.log('Enemy tiles:', enemyCount);
  }
}

 
class Enemy {
	constructor(field, x, y) {
		this.field = field;
		this.x = x;
		this.y = y;
		this.health = 100;
		this.maxHealth = 100;
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
	
	 
	takeDamage(amount) {
		 
		this.health -= amount;
		
		 
		if (this.health <= 0) {
			this.health = 0;
			return true;  
		}
		
		return false;  
	}
	
	 
	calculateDamage() {
		 
		const randomFactor = Math.random() * 1.5 + 0.8;  
		return Math.floor(this.damage * randomFactor);
	}
}


