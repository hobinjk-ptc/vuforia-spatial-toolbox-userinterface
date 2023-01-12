const needleTipHeight = 16;
const needleTipWidth = 16;
const needlePad = 4;
const needleWidth = 4;
const needleDragWidth = 8;

const rowPad = 4;
const rowHeight = 16;
const boardHeight = 6 * (rowPad + rowHeight) + rowPad;
const boardStart = needleTipHeight + needlePad;

const DragMode = {
    NONE: 'none',
    SELECT: 'select',
    PAN: 'pan',
};

export class Timeline {
    constructor(container) {
        this.canvas = document.createElement('canvas');
        this.canvas.classList.add('analytics-timeline');
        this.gfx = this.canvas.getContext('2d');
        this.pixelsPerMs = 0.01; // 1024 * 100 / (24 * 60 * 60 * 1000);
        this.timeMin = -1;
        this.widthMs = -1;
        this.scrolled = true;
        container.appendChild(this.canvas);
        this.poses = [];
        this.width = -1;
        this.height = boardHeight + needleTipHeight + needlePad;
        this.highlightRegion = null;

        this.dragMode = DragMode.NONE;
        this.mouseX = -1;
        this.mouseY = -1;

        this.onPointerDown = this.onPointerDown.bind(this);
        this.onPointerMove = this.onPointerMove.bind(this);
        this.onPointerUp = this.onPointerUp.bind(this);
        this.onPointerOver = this.onPointerOver.bind(this);
        this.onPointerOut = this.onPointerOut.bind(this);
        this.onWheel = this.onWheel.bind(this);

        this.canvas.addEventListener('pointerdown', this.onPointerDown);
        this.canvas.addEventListener('pointermove', this.onPointerMove);
        this.canvas.addEventListener('pointerup', this.onPointerUp);
        this.canvas.addEventListener('pointerover', this.onPointerOver);
        this.canvas.addEventListener('pointerout', this.onPointerOut);
        this.canvas.addEventListener('wheel', this.onWheel);
    }

    draw() {
        if (this.width < 0) {
            let rect = this.canvas.getBoundingClientRect();
            this.width = rect.width;
            this.widthMs = this.width / this.pixelsPerMs;
            this.canvas.width = this.width;
            this.canvas.height = this.height;
            this.gfx.width = this.width;
            this.gfx.height = this.height;
        }
        if (this.timeMin > 0 && !this.scrolled) {
            this.timeMin = Date.now() - this.widthMs / 2;
        }

        this.gfx.clearRect(0, 0, this.width, this.height);

        this.gfx.fillStyle = '#000';
        this.gfx.fillRect(0, needleTipHeight, this.width, boardHeight);

        this.drawPoses();

        if (this.highlightRegion) {
            let startX = this.timeToX(this.highlightRegion.startTime);
            this.gfx.fillStyle = '#00ffff';
            this.gfx.beginPath();
            this.gfx.moveTo(startX + needleWidth / 2, 0);
            this.gfx.lineTo(startX + needleWidth / 2, this.height);
            this.gfx.lineTo(startX - needleWidth / 2, this.height);
            this.gfx.lineTo(startX - needleWidth / 2, boardStart - needlePad);
            this.gfx.lineTo(startX - needleWidth / 2 - needleTipWidth, 0);
            this.gfx.closePath();
            this.gfx.fill();

            let endX = this.timeToX(this.highlightRegion.endTime);
            this.gfx.fillStyle = '#00ffff';
            this.gfx.beginPath();
            this.gfx.moveTo(endX - needleWidth / 2, 0);
            this.gfx.lineTo(endX - needleWidth / 2, this.height);
            this.gfx.lineTo(endX + needleWidth / 2, this.height);
            this.gfx.lineTo(endX + needleWidth / 2, boardStart - needlePad);
            this.gfx.lineTo(endX + needleWidth / 2 + needleTipWidth, 0);
            this.gfx.closePath();
            this.gfx.fill();

            // dim rest of board
        }
    }

    timeToX(timeMs) {
        return (timeMs - this.timeMin) * this.pixelsPerMs;
    }

    xToTime(x) {
        return x / this.pixelsPerMs + this.timeMin;
    }

    isHighlight(time) {
        if (!this.highlightRegion) {
            return false;
        }
        return time >= this.highlightRegion.startTime &&
            time <= this.highlightRegion.endTime;
    }

    drawPoses() {
        if (this.poses.length < 1) {
            return;
        }
        let lastPoseTime = this.poses[0].time;
        let startSectionTime = lastPoseTime;
        const maxPoseDelayLenience = 500;
        const rowY = boardStart + rowPad;
        const timeMax = this.timeMin + this.widthMs;

        let baseFill = 'hsl(120, 80%, 50%)';
        let highlightFill = 'hsl(60, 80%, 50%)';
        if (this.highlightRegion) {
            baseFill = 'hsl(120, 50%, 25%)';
        }
        let highlight = false;
        for (let pose of this.poses) {
            if (pose.time < this.timeMin) {
                lastPoseTime = pose.time;
                continue;
            }
            if (pose.time > this.timeMin + this.widthMs) {
                break;
            }
            let newHighlight = this.isHighlight(pose.time);
            if (pose.time - lastPoseTime < maxPoseDelayLenience &&
                highlight === newHighlight) {
                lastPoseTime = pose.time;
                continue;
            }
            this.gfx.fillStyle =
                highlight ?
                highlightFill :
                baseFill;
            highlight = newHighlight;
            const startX = this.timeToX(startSectionTime);
            const endX = this.timeToX(lastPoseTime);
            this.gfx.fillRect(
                startX,
                rowY,
                endX - startX,
                rowHeight
            );
            lastPoseTime = pose.time;
            startSectionTime = lastPoseTime;
        }

        if (timeMax - lastPoseTime < maxPoseDelayLenience) {
            lastPoseTime = timeMax;
        }

        highlight = this.isHighlight(lastPoseTime);
        this.gfx.fillStyle =
            highlight ?
            highlightFill :
            baseFill;
        const startX = this.timeToX(startSectionTime);
        const endX = this.timeToX(lastPoseTime);
        this.gfx.fillRect(
            startX,
            rowY,
            endX - startX,
            rowHeight
        );
    }

    appendPose(pose) {
        this.poses.push(pose);
        if (this.timeMin < 0 && this.width > 0) {
            this.timeMin = pose.time - this.widthMs / 2;
        }
    }

    updatePointer(event) {
        this.mouseX = event.offsetX;
        this.mouseY = event.offsetY;
    }

    isPointerOnActiveRow() {
        return this.mouseY > boardStart &&
            this.mouseY < boardStart + rowPad * 2 + rowHeight;
    }

    isPointerOnBoard() {
        return this.mouseY > boardStart &&
            this.mouseY < boardStart + boardHeight;
    }

    isPointerOnNeedle() {
        return this.isPointerOnStartNeedle() ||
            this.isPointerOnEndNeedle();
    }

    isPointerOnStartNeedle() {
        if (!this.highlightRegion) {
            return false;
        }
        let startX = this.timeToX(this.highlightRegion.startTime);
        let width = needleDragWidth;
        if (this.mouseY < boardStart) {
            width = needleTipWidth + needlePad * 2;
            startX -= width / 2;
        }

        return Math.abs(this.mouseX - startX) < width / 2;
    }

    isPointerOnEndNeedle() {
        if (!this.highlightRegion) {
            return false;
        }
        let endX = this.timeToX(this.highlightRegion.endTime);
        let width = needleDragWidth;
        if (this.mouseY < boardStart) {
            width = needleTipWidth + needlePad * 2;
            endX += width / 2;
        }

        return Math.abs(this.mouseX - endX) < width / 2;
    }

    onPointerDown(event) {
        if (realityEditor.device.isMouseEventCameraControl(event)) return;

        this.updatePointer(event);

        if (this.isPointerOnActiveRow() || this.isPointerOnNeedle()) {
            this.dragMode = DragMode.SELECT;
            this.highlightStartX = event.offsetX;
        } else {
            this.dragMode = DragMode.PAN;
        }
        event.stopPropagation();
    }

    onPointerMove(event) {
        if (realityEditor.device.isMouseEventCameraControl(event)) return;

        this.updatePointer(event);

        switch (this.dragMode) {
        case DragMode.NONE:
            this.onPointerMoveDragModeNone(event);
            break;
        case DragMode.SELECT:
            this.onPointerMoveDragModeSelect(event);
            break;
        case DragMode.PAN:
            this.onPointerMoveDragModePan(event);
            break;
        }
        event.stopPropagation();
    }

    onPointerMoveDragModeNone(_event) {
        let cursor = 'default';
        if (this.isPointerOnActiveRow() || this.isPointerOnNeedle()) {
            cursor = 'col-resize';
        } else if (this.isPointerOnBoard()) {
            cursor = 'move';
        }
        this.canvas.style.cursor = cursor;

        realityEditor.analytics.setCursorTime(this.xToTime(this.mouseX));
    }

    onPointerMoveDragModeSelect(_event) {
        this.canvas.style.cursor = 'col-resize';
        let highlightEndX = this.mouseX;

        let startTime = this.xToTime(Math.min(this.highlightStartX, highlightEndX));
        let endTime = this.xToTime(Math.max(this.highlightStartX, highlightEndX));
        realityEditor.analytics.setHighlightRegion({
            startTime,
            endTime,
        });
    }

    onPointerMoveDragModePan(event) {
        this.canvas.style.cursor = 'move';
        let dTime = event.movementX / this.pixelsPerMs;
        this.timeMin -= dTime;
    }

    setCursorTime(cursorTime) {
        this.cursorTime = cursorTime;
    }

    setHighlightRegion(highlightRegion) {
        this.highlightRegion = highlightRegion;
    }

    onPointerUp(event) {
        if (realityEditor.device.isMouseEventCameraControl(event)) return;

        this.updatePointer(event);

        this.dragMode = DragMode.NONE;
        realityEditor.analytics.setCursorTime(-1);

        event.stopPropagation();
    }

    onPointerOver(event) {
        if (realityEditor.device.isMouseEventCameraControl(event)) return;

        this.updatePointer(event);
    }

    onPointerOut(_event) {
        realityEditor.analytics.setCursorTime(-1);
    }

    onWheel(event) {
    }
}
