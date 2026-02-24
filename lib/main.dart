import 'dart:async';
import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

void main() {
  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => GameState()),
      ],
      child: const PawsAndPauseApp(),
    ),
  );
}

class PawsAndPauseApp extends StatelessWidget {
  const PawsAndPauseApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Paws and Pause',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        primarySwatch: Colors.amber,
        useMaterial3: true,
        // Base mustard color
        scaffoldBackgroundColor: const Color(0xFFFFD54F),
      ),
      home: const HomeScreen(),
    );
  }
}

// --- Enums & State (Unchanged) ---
enum DogMood { idle, watching, happy, playing, eating, sad }

class GameState extends ChangeNotifier with WidgetsBindingObserver {
  int _focusDurationMinutes = 25;
  int _remainingSeconds = 0;
  Timer? _timer;
  bool _isFocusing = false;
  bool _isOnBreak = false;
  int _bones = 0;
  DogMood _mood = DogMood.idle;
  Timer? _moodResetTimer;

  GameState() {
    WidgetsBinding.instance.addObserver(this);
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _timer?.cancel();
    _moodResetTimer?.cancel();
    super.dispose();
  }

  int get focusDurationMinutes => _focusDurationMinutes;
  int get remainingSeconds => _remainingSeconds;
  bool get isFocusing => _isFocusing;
  bool get isOnBreak => _isOnBreak;
  int get bones => _bones;
  DogMood get mood => _mood;

  String get timerString {
    final minutes = (_remainingSeconds / 60).floor();
    final seconds = _remainingSeconds % 60;
    return '${minutes.toString().padLeft(2, '0')}:${seconds.toString().padLeft(2, '0')}';
  }

  void setDuration(double value) {
    if (!_isFocusing) {
      _focusDurationMinutes = value.toInt();
      notifyListeners();
    }
  }

  void startFocus() {
    if (_isFocusing) return;
    _isFocusing = true;
    _isOnBreak = false;
    _remainingSeconds = _focusDurationMinutes * 60;
    _setMood(DogMood.watching);
    _startTimer();
    notifyListeners();
  }

  void _startTimer() {
    _timer?.cancel();
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (_remainingSeconds > 0) {
        _remainingSeconds--;
        if (_remainingSeconds % 60 == 0 && _remainingSeconds != 0) {
          if (DateTime.now().second % 5 == 0)
            _triggerShortMood(DogMood.playing);
          _bones++;
        }
      } else {
        _finishSession();
      }
      notifyListeners();
    });
  }

  void _finishSession() {
    _timer?.cancel();
    _isFocusing = false;
    _isOnBreak = false;
    _bones += 5;
    _setMood(DogMood.playing);
    notifyListeners();
  }

  void petDog() {
    if (_mood == DogMood.sad)
      _setMood(_isFocusing ? DogMood.watching : DogMood.idle);
    _triggerShortMood(DogMood.happy);
  }

  void takeBreak() {
    if (!_isFocusing || _isOnBreak || _bones < 1) return;
    _bones--;
    _isOnBreak = true;
    _timer?.cancel();
    _setMood(DogMood.eating);
    notifyListeners();
  }

  void resumeFocus() {
    if (!_isOnBreak) return;
    _isOnBreak = false;
    _setMood(DogMood.watching);
    _startTimer();
    notifyListeners();
  }

  void stopSession() {
    _timer?.cancel();
    _isFocusing = false;
    _isOnBreak = false;
    _setMood(DogMood.idle);
    notifyListeners();
  }

  void _setMood(DogMood newMood) {
    _mood = newMood;
    notifyListeners();
  }

  void _triggerShortMood(DogMood tempMood) {
    if (_mood == DogMood.sad && tempMood != DogMood.happy) return;
    _mood = tempMood;
    notifyListeners();
    _moodResetTimer?.cancel();
    _moodResetTimer = Timer(const Duration(milliseconds: 1500), () {
      if (_isFocusing && !_isOnBreak)
        _mood = DogMood.watching;
      else if (_isOnBreak)
        _mood = DogMood.eating;
      else
        _mood = DogMood.idle;
      notifyListeners();
    });
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.paused || state == AppLifecycleState.hidden) {
      if (_isFocusing && !_isOnBreak) {
        _failSession();
      }
    }
  }

  void _failSession() {
    _timer?.cancel();
    _isFocusing = false;
    _isOnBreak = false;
    _remainingSeconds = 0;
    
    _setMood(DogMood.sad);
    notifyListeners();
  }
}

// --- UI ---

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final state = context.watch<GameState>();
    final size = MediaQuery.of(context).size;

    // Text color that pops against mustard
    const textColor = Color(0xFF3E2723); // Deep warm brown/black

    return Scaffold(
      body: Stack(
        alignment: Alignment.center,
        children: [
          // LAYER 1: The New Cozy Background
          const Positioned.fill(
            child: CustomPaint(
              painter: CozyWarmBackgroundPainter(),
            ),
          ),

          // LAYER 2: The Timer Text
          Positioned(
            top: size.height * 0.15,
            child: Column(
              children: [
                Text(
                  state.timerString,
                  style: const TextStyle(
                    fontSize: 110,
                    height: 1.0,
                    fontWeight: FontWeight.w900,
                    color: textColor,
                    letterSpacing: -3,
                  ),
                ),
                if (!state.isFocusing)
                  Container(
                    margin: const EdgeInsets.only(top: 20),
                    width: 250,
                    child: Slider(
                      value: state.focusDurationMinutes.toDouble(),
                      min: 5,
                      max: 120,
                      divisions: 23,
                      activeColor: textColor,
                      inactiveColor: textColor.withOpacity(0.3),
                      label: "${state.focusDurationMinutes}",
                      onChanged: (val) =>
                          context.read<GameState>().setDuration(val),
                    ),
                  ),
              ],
            ),
          ),

          // LAYER 3: The Dog
          Positioned(
            bottom: size.height * 0.18,
            child: GestureDetector(
              onTap: () => context.read<GameState>().petDog(),
              child: SizedBox(
                height: 280,
                width: 280,
                child: CartoonDogWidget(mood: state.mood),
              ),
            ),
          ),

          // LAYER 4: UI Overlays (Bone Counter)
          Positioned(
            top: 50,
            right: 20,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              decoration: BoxDecoration(
                  color: textColor,
                  borderRadius: BorderRadius.circular(30),
                  boxShadow: [
                    BoxShadow(
                        color: textColor.withOpacity(0.3),
                        blurRadius: 8,
                        offset: const Offset(0, 4))
                  ]),
              child: Row(
                children: [
                  const Icon(Icons.catching_pokemon,
                      color: Colors.white, size: 20),
                  const SizedBox(width: 8),
                  Text("${state.bones}",
                      style: const TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          color: Colors.white)),
                ],
              ),
            ),
          ),

          // Bottom Controls
          Positioned(
            bottom: 40,
            left: 20,
            right: 20,
            child: _buildControls(context, state, textColor),
          ),
        ],
      ),
    );
  }

  Widget _buildControls(
      BuildContext context, GameState state, Color textColor) {
    final buttonStyle = ElevatedButton.styleFrom(
      backgroundColor: textColor,
      foregroundColor: Colors.white,
      padding: const EdgeInsets.symmetric(vertical: 16),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      elevation: 8,
      shadowColor: textColor.withOpacity(0.5),
    );

    if (!state.isFocusing) {
      return ElevatedButton.icon(
        style: buttonStyle,
        onPressed: () => context.read<GameState>().startFocus(),
        icon: const Icon(Icons.play_arrow),
        label: const Text("START FOCUS",
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
      );
    }
    if (state.isOnBreak) {
      return ElevatedButton.icon(
        onPressed: () => context.read<GameState>().resumeFocus(),
        style: buttonStyle.copyWith(
            backgroundColor: MaterialStateProperty.all(Colors.green.shade800)),
        icon: const Icon(Icons.play_arrow),
        label: const Text("RESUME FOCUS",
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
      );
    }
    return ElevatedButton.icon(
      style: buttonStyle.copyWith(
          backgroundColor: MaterialStateProperty.all(Colors.orange.shade800)),
      onPressed:
          state.bones > 0 ? () => context.read<GameState>().takeBreak() : null,
      icon: const Icon(Icons.fastfood),
      label: const Text("FEED (BREAK)",
          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
    );
  }
}

// --- VISUALS: New "Cozy" Background ---

class CozyWarmBackgroundPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()..style = PaintingStyle.fill;

    // 1. Base Color (Deep Mustard)
    paint.color = const Color(0xFFFFD54F);
    canvas.drawRect(Rect.fromLTWH(0, 0, size.width, size.height), paint);

    // 2. Soft glowing orbs (Bokeh effect)
    // Use a blur mask for soft edges
    paint.maskFilter = const MaskFilter.blur(BlurStyle.normal, 60);

    // Warm Orange Orb (Bottom Left)
    paint.color = const Color(0xFFFFB300).withOpacity(0.6);
    canvas.drawCircle(
        Offset(size.width * 0.2, size.height * 0.8), size.width * 0.4, paint);

    // Lighter Cream/Gold Orb (Top Right)
    paint.color = const Color(0xFFFFF59D).withOpacity(0.5);
    canvas.drawCircle(
        Offset(size.width * 0.8, size.height * 0.3), size.width * 0.5, paint);

    // Deep Warm Spot (Behind dog area)
    paint.color = const Color(0xFFFF8F00).withOpacity(0.3);
    canvas.drawCircle(
        Offset(size.width * 0.5, size.height * 0.9), size.width * 0.3, paint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

// --- Cartoon Dog Widget (Unchanged logic, tweaked shadow color) ---

class CartoonDogWidget extends StatefulWidget {
  final DogMood mood;
  const CartoonDogWidget({super.key, required this.mood});

  @override
  State<CartoonDogWidget> createState() => _CartoonDogWidgetState();
}

class _CartoonDogWidgetState extends State<CartoonDogWidget>
    with SingleTickerProviderStateMixin {
  late AnimationController _animController;

  @override
  void initState() {
    super.initState();
    _animController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1500),
    )..repeat(reverse: true);
  }

  @override
  void dispose() {
    _animController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _animController,
      builder: (context, child) {
        double breathY = 0.0;
        double tailAngle = 0.0;
        double headTilt = 0.0;
        double earLift = 0.0;

        switch (widget.mood) {
          case DogMood.watching:
            breathY = _animController.value * 2.0;
            tailAngle = math.sin(_animController.value * math.pi) * 0.1;
            headTilt = math.sin(_animController.value * math.pi * 0.5) * 0.05;
            break;
          case DogMood.happy:
          case DogMood.playing:
            breathY = math.sin(_animController.value * math.pi * 4) * 5.0;
            tailAngle = math.sin(_animController.value * math.pi * 8) * 0.4;
            earLift = 5.0;
            break;
          case DogMood.sad:
            breathY = 0.0;
            tailAngle = 0.1;
            headTilt = 0.1;
            break;
          default:
            breathY = _animController.value * 2.0;
            break;
        }

        return CustomPaint(
          painter: CartoonDogPainter(
              mood: widget.mood,
              breathOffset: breathY,
              tailAngle: tailAngle,
              headTilt: headTilt,
              earLift: earLift),
          size: const Size(280, 280),
        );
      },
    );
  }
}

class CartoonDogPainter extends CustomPainter {
  final DogMood mood;
  final double breathOffset;
  final double tailAngle;
  final double headTilt;
  final double earLift;

  CartoonDogPainter({
    required this.mood,
    required this.breathOffset,
    required this.tailAngle,
    required this.headTilt,
    required this.earLift,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final centerX = size.width / 2;
    final bottomY = size.height * 0.95;

    final furColor = const Color(0xFFEAA221);
    final bellyColor = const Color(0xFFFFF3E0);
    final earColor = const Color(0xFFC47100);
    final paint = Paint()..style = PaintingStyle.fill;

    // GROUND SHADOW (Tweaked color for warmth)
    // Using a deep warm brown instead of flat black looks better on the mustard
    paint.color = const Color(0xFF5D4037).withOpacity(0.3);
    canvas.drawOval(
        Rect.fromCenter(
            center: Offset(centerX, bottomY), width: 140, height: 20),
        paint);

    // Tail
    canvas.save();
    canvas.translate(centerX, bottomY - 40);
    canvas.rotate(tailAngle);
    paint.color = earColor;
    final tailPath = Path();
    tailPath.moveTo(0, 0);
    tailPath.quadraticBezierTo(40, -10, 50, -50);
    tailPath.quadraticBezierTo(20, -60, 0, -20);
    canvas.drawPath(tailPath, paint);
    canvas.restore();

    // Body
    paint.color = furColor;
    final bodyPath = Path();
    bodyPath.moveTo(centerX - 50, bottomY);
    bodyPath.lineTo(centerX + 50, bottomY);
    bodyPath.quadraticBezierTo(
        centerX + 60, bottomY - 80, centerX + 30, bottomY - 110);
    bodyPath.quadraticBezierTo(
        centerX, bottomY - 100, centerX - 30, bottomY - 110);
    bodyPath.quadraticBezierTo(
        centerX - 60, bottomY - 80, centerX - 50, bottomY);
    canvas.drawPath(bodyPath, paint);
    paint.color = bellyColor;
    canvas.drawOval(
        Rect.fromCenter(
            center: Offset(centerX, bottomY - 40), width: 50, height: 60),
        paint);

    // Head
    canvas.save();
    canvas.translate(centerX, bottomY - 110 - breathOffset);
    canvas.rotate(headTilt);
    paint.color = furColor;
    canvas.drawRRect(
        RRect.fromRectAndRadius(
            Rect.fromCenter(
                center: const Offset(0, 0), width: 140, height: 120),
            const Radius.circular(45)),
        paint);
    _drawEars(canvas, paint, earColor);
    paint.color = bellyColor;
    canvas.drawOval(
        Rect.fromCenter(center: const Offset(0, 20), width: 80, height: 50),
        paint);
    paint.color = const Color(0xFF3E2723);
    canvas.drawOval(
        Rect.fromCenter(center: const Offset(0, 10), width: 25, height: 16),
        paint);
    _drawEyes(canvas);
    _drawMouth(canvas);
    canvas.restore();

    // Paws
    paint.color = bellyColor;
    canvas.drawOval(
        Rect.fromCenter(
            center: Offset(centerX - 40, bottomY), width: 35, height: 25),
        paint);
    canvas.drawOval(
        Rect.fromCenter(
            center: Offset(centerX + 40, bottomY), width: 35, height: 25),
        paint);
  }

  void _drawEars(Canvas canvas, Paint paint, Color color) {
    paint.color = color;
    final leftPath = Path();
    leftPath.moveTo(-60, -20);
    leftPath.cubicTo(-90 - earLift, -20 - earLift, -100, 60 - earLift, -60, 50);
    leftPath.quadraticBezierTo(-50, 20, -60, -20);
    canvas.drawPath(leftPath, paint);
    final rightPath = Path();
    rightPath.moveTo(60, -20);
    rightPath.cubicTo(90 + earLift, -20 - earLift, 100, 60 - earLift, 60, 50);
    rightPath.quadraticBezierTo(50, 20, 60, -20);
    canvas.drawPath(rightPath, paint);
  }

  void _drawEyes(Canvas canvas) {
    final paint = Paint()
      ..color = const Color(0xFF3E2723)
      ..strokeWidth = 4
      ..strokeCap = StrokeCap.round
      ..style = PaintingStyle.stroke;
    if (mood == DogMood.happy || mood == DogMood.playing) {
      canvas.drawArc(
          Rect.fromCenter(
              center: const Offset(-30, -10), width: 20, height: 20),
          math.pi,
          math.pi,
          false,
          paint);
      canvas.drawArc(
          Rect.fromCenter(center: const Offset(30, -10), width: 20, height: 20),
          math.pi,
          math.pi,
          false,
          paint);
    } else if (mood == DogMood.sad) {
      canvas.drawLine(const Offset(-40, -15), const Offset(-20, -10), paint);
      canvas.drawLine(const Offset(40, -15), const Offset(20, -10), paint);
    } else {
      paint.style = PaintingStyle.fill;
      canvas.drawCircle(const Offset(-30, -10), 7, paint);
      canvas.drawCircle(const Offset(30, -10), 7, paint);
      paint.color = Colors.white;
      canvas.drawCircle(const Offset(-32, -12), 2.5, paint);
      canvas.drawCircle(const Offset(28, -12), 2.5, paint);
    }
  }

  void _drawMouth(Canvas canvas) {
    final paint = Paint()
      ..color = const Color(0xFF3E2723)
      ..strokeWidth = 3
      ..strokeCap = StrokeCap.round
      ..style = PaintingStyle.stroke;
    if (mood == DogMood.happy || mood == DogMood.playing) {
      paint.style = PaintingStyle.fill;
      paint.color = const Color(0xFF3E2723);
      canvas.drawArc(
          Rect.fromCenter(center: const Offset(0, 35), width: 30, height: 20),
          0,
          math.pi,
          false,
          paint);
      paint.color = Colors.pinkAccent;
      canvas.drawArc(
          Rect.fromCenter(center: const Offset(0, 38), width: 16, height: 16),
          0,
          math.pi,
          false,
          paint);
    } else if (mood == DogMood.sad) {
      canvas.drawArc(
          Rect.fromCenter(center: const Offset(0, 40), width: 20, height: 10),
          math.pi,
          math.pi,
          false,
          paint);
    } else {
      canvas.drawArc(
          Rect.fromCenter(center: const Offset(-8, 30), width: 16, height: 10),
          0,
          math.pi,
          false,
          paint);
      canvas.drawArc(
          Rect.fromCenter(center: const Offset(8, 30), width: 16, height: 10),
          0,
          math.pi,
          false,
          paint);
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => true;
}
