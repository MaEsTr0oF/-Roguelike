class Game {
	constructor() {
		console.log('Game constructor');
		this.field = new Field();
	}
	init() {
		console.log('Game init');
		this.field.init();
		this.field.makeRooms();
		this.field.render();
	}
	render() {
		this.field.render();
	}
}

class Field {
	constructor() {
		console.log('Field constructor');
		this.tiles = [];
		this.$element = $('.field');
		this.width = 40;
		this.height = 24;
		this.tileSize = 40; // Размер тайла в пикселях
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
					// Убираем класс стены, если он был
					this.$element.removeClass('tileW');
					// Добавляем пустой тайл для комнаты
					this.$element.css('background-image', 'url(images/tile-.png)');
				}
				this.$element.css({
					left: this.x * this.field.tileSize + 'px',
					top: this.y * this.field.tileSize + 'px',
					width: this.field.tileSize + 'px',
					height: this.field.tileSize + 'px'
				});
			} else {
				// Обновляем существующий элемент
				if (this.type === 'wall') {
					this.$element.addClass('tileW').css('background-image', 'url(images/tile-W.png)');
				}
				if (this.type === 'room') {
					this.$element.removeClass('tileW').css('background-image', 'url(images/tile-.png)');
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
			tile.type = type;
			// Обновляем отображение тайла, если он уже отрендерен
			if (tile.$element) {
				tile.render();
			}
		}
	}

	canPlaceRoom(x, y, size) {
		// Проверяем с учетом стен вокруг (size + 2 на size + 2)
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
		// for (let i = x - 1; i <= x + size; i++) {
		// 	this.setTileType(i, y - 1, 'wall');  // верхняя стена
		// 	this.setTileType(i, y + size, 'wall'); // нижняя стена
		// }
		// for (let j = y - 1; j <= y + size; j++) {
		// 	this.setTileType(x - 1, j, 'wall');  // левая стена
		// 	this.setTileType(x + size, j, 'wall'); // правая стена
		// }

		// Заполняем саму комнату
		console.log('Тайлы комнаты:');
		for (let i = x; i < x + size; i++) {
			for (let j = y; j < y + size; j++) {
				console.log(`Тайл комнаты: x=${i}, y=${j}`);
				this.setTileType(i, j, 'room');
			}
		}
		console.log('Room created at:', x, y, 'size:', size);
	}

	makeRooms() {
		// Случайное количество комнат от 5 до 10
		const numRooms = Math.floor(Math.random() * 6) + 5;
		let roomsCreated = 0;
		
		console.log(`Пытаемся создать ${numRooms} комнат`);
		
		let cnt = 0;
		while (roomsCreated < numRooms) {
			 // Случайный размер комнаты от 3 до 8
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
			 if (cnt > 1000) break; // Защита от бесконечного цикла
		}
		
		console.log(`Всего создано комнат: ${roomsCreated} из ${numRooms}`);
  }

	render() {
		console.log('Field render');
		this.$element.empty();
		let wallCount = 0;
		let roomCount = 0;
		
		for (let i = 0; i < this.tiles.length; i++) {
			 if (this.tiles[i].type === 'wall') wallCount++;
			 if (this.tiles[i].type === 'room') roomCount++;
			 this.$element.append(this.tiles[i].render());
		}
		
		console.log('Rendered tiles:', this.$element.children().length);
		console.log('Wall tiles:', wallCount);
		console.log('Room tiles:', roomCount);
  }
}


