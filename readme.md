## 技术需求说明书：Quest 3 WebXR 空间测量工具

### 1. 核心变更点 (Diff)

* **方案**：**直接获取手柄/手部当前的 3D 坐标** -> 在该空间坐标处生成方块（不依赖任何平面检测，可以在空中画点）。

### 2. 开发环境与依赖

* **设备**：Meta Quest 3 (Meta Quest Browser)
* **技术栈**：Three.js (r150+), WebXR Device API
* **渲染模式**：`immersive-ar` (必须开启 Passthrough 透视)

---

### 3. 功能模块详细说明

#### 模块 A：输入与生成 (Input & Spawning)

**逻辑描述**：
当用户按下手柄扳机（Trigger）或进行手势捏合（Select）时，在控制器的**抓握中心**或**射线发射端点**生成一个 5cm 的红色立方体。

**给程序员的执行指令**：

1. 监听 WebXR 的 `select` 事件。
2. **不要使用** `hit-test` 结果。
3. 直接读取 `controller` 或 `gripSpace` 的世界坐标矩阵 (`matrixWorld`)。
4. 在该坐标处实例化 Mesh。

**伪代码/关键 API**：

```javascript
// 在 select 事件回调中
function onSelect() {
    const controller = renderer.xr.getController(0); // 获取右手柄
    
    // 关键点：直接拿手柄的位置，而不是去检测地面
    const position = new THREE.Vector3();
    const rotation = new THREE.Quaternion();
    
    // 提取当前手柄在世界坐标系下的位置
    controller.getWorldPosition(position); 
    controller.getWorldQuaternion(rotation);

    spawnCube(position); // 生成方块
}

```

#### 模块 B：测量算法 (Measurement Logic)

**逻辑描述**：
记录两个点（Point A 和 Point B），计算 B 相对于 A 的空间关系。

**计算公式（必须严格执行）**：

1. **距离 (Distance)**：Point A 到 Point B 的直线距离。
2. **俯仰角 (Pitch)**：以 A 为原点，看 B 是抬头还是低头。
3. **方位角 (Bearing/Yaw)**：以 A 为原点，看 B 在水平方向偏左还是偏右。

**给程序员的算法实现**：

```javascript
// p1 = 起点, p2 = 终点 (均为 THREE.Vector3)
const direction = new THREE.Vector3().subVectors(p2, p1).normalize(); // 归一化方向向量

// 1. 距离
const distance = p1.distanceTo(p2);

// 2. 俯仰角 (Pitch) - Y轴分量
// asin 返回弧度，需转为角度
const pitchAngle = THREE.MathUtils.radToDeg(Math.asin(direction.y));

// 3. 方位角 (Yaw) - XZ平面投影
// atan2(z, x) 返回弧度，需转为角度。注意 Three.js 坐标系中 Z 是深度
const yawAngle = THREE.MathUtils.radToDeg(Math.atan2(direction.z, direction.x));

// 输出示例: "距离: 1.5m, 仰角: 15°, 方位: 45°"

```

#### 模块 C：可视化反馈 (Visual Feedback)

1. **连线**：在 Point A 和 Point B 之间绘制一条黄色的线 (`THREE.Line`)。
2. **文字标签**：在连线的中点（`(p1 + p2) / 2`）生成一个始终朝向用户的文字标签（Billboard Text），显示距离和角度数值。

---

### 4. 验收标准 (Acceptance Criteria)

1. **空中画图**：用户举起手在空中按扳机，方块应准确出现在手柄尖端位置，不掉落到地上。
2. **数据准确**：

* 将手柄水平移动 1 米，显示的距离应约为 1.00m。
* 将手柄垂直向上移动，俯仰角应接近 90°。

1. **性能**：在 Quest 3 透视模式下保持 72fps 以上，无明显延迟。

### 5. 给程序员的注意事项

* **坐标系**：WebXR 默认也是右手坐标系（Y Up, -Z Forward）。确保计算角度时不要搞混 X 和 Z。
* **控制器偏移**：`renderer.xr.getController(0)` 获取的是射线原点，如果想让方块出现在手柄握把处，请使用 `getControllerGrip(0)`。建议使用**射线原点**，视觉上更符合“从手柄射出”的感觉。
