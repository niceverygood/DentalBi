import 'dart:io';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:path/path.dart' as path;
import 'package:shared_preferences/shared_preferences.dart';

/// 녹음 파일 감지 + 자동 업로드 서비스
class RecordingService extends ChangeNotifier {
  bool _isMonitoring = false;
  final List<UploadRecord> _uploadHistory = [];
  String? _lastError;

  bool get isMonitoring => _isMonitoring;
  List<UploadRecord> get uploadHistory => List.unmodifiable(_uploadHistory);
  String? get lastError => _lastError;

  /// 안드로이드 기본 녹음 폴더 경로들
  static const List<String> _recordingPaths = [
    '/storage/emulated/0/Recordings/Call',           // Samsung
    '/storage/emulated/0/Call',                       // LG
    '/storage/emulated/0/Record/Call',                // Xiaomi
    '/storage/emulated/0/MIUI/sound_recorder/call_rec', // MIUI
    '/storage/emulated/0/Sounds/CallRecording',       // OnePlus
    '/storage/emulated/0/Music/Recordings/Call recordings', // Pixel
  ];

  /// 녹음 폴더 자동 탐색
  String? findRecordingDirectory() {
    for (final dirPath in _recordingPaths) {
      final dir = Directory(dirPath);
      if (dir.existsSync()) {
        return dirPath;
      }
    }
    return null;
  }

  /// 모니터링 시작: 녹음 폴더를 감시하여 새 파일 감지 시 자동 업로드
  Future<void> startMonitoring() async {
    final recordingDir = findRecordingDirectory();
    if (recordingDir == null) {
      _lastError = '녹음 폴더를 찾을 수 없습니다. 기기에서 통화 녹음을 활성화해주세요.';
      notifyListeners();
      return;
    }

    _isMonitoring = true;
    _lastError = null;
    notifyListeners();

    // 폴더 감시
    final dir = Directory(recordingDir);
    dir.watch(events: FileSystemEvent.create).listen((event) async {
      if (event is FileSystemCreateEvent) {
        final filePath = event.path;
        final ext = path.extension(filePath).toLowerCase();

        // 오디오 파일만 처리
        if (['.m4a', '.amr', '.mp3', '.wav', '.ogg', '.3gp'].contains(ext)) {
          // 파일 쓰기 완료 대기 (녹음 종료 후)
          await Future.delayed(const Duration(seconds: 3));
          await uploadRecording(filePath);
        }
      }
    });

    debugPrint('Monitoring started: $recordingDir');
  }

  /// 모니터링 중지
  void stopMonitoring() {
    _isMonitoring = false;
    notifyListeners();
  }

  /// 녹음 파일 업로드
  Future<bool> uploadRecording(String filePath, {
    String? patientName,
    String? phoneNumber,
    String? pendingTx,
    double? riskScore,
  }) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('access_token');
      final serverUrl = prefs.getString('server_url') ?? 'http://localhost:8000';

      if (token == null) {
        _lastError = '로그인이 필요합니다';
        notifyListeners();
        return false;
      }

      final file = File(filePath);
      if (!file.existsSync()) {
        _lastError = '파일을 찾을 수 없습니다: $filePath';
        notifyListeners();
        return false;
      }

      // 파일 크기 체크 (50MB 이하)
      final fileSize = await file.length();
      if (fileSize > 50 * 1024 * 1024) {
        _lastError = '파일 크기 초과 (50MB 이하)';
        notifyListeners();
        return false;
      }

      // 통화 시간 추정 (파일 수정 시간 기반)
      final stat = await file.stat();
      final duration = stat.modified.difference(stat.accessed).inSeconds.abs();

      // Multipart 업로드
      final request = http.MultipartRequest(
        'POST',
        Uri.parse('$serverUrl/api/crm/upload'),
      );

      request.headers['Authorization'] = 'Bearer $token';
      request.files.add(await http.MultipartFile.fromPath('file', filePath));
      request.fields['direction'] = 'outbound';
      request.fields['duration'] = duration.toString();

      if (patientName != null) request.fields['patient_name'] = patientName;
      if (phoneNumber != null) request.fields['phone_number'] = phoneNumber;
      if (pendingTx != null) request.fields['pending_tx'] = pendingTx;
      if (riskScore != null) request.fields['risk_score'] = riskScore.toString();

      final response = await request.send();

      if (response.statusCode == 200) {
        final record = UploadRecord(
          fileName: path.basename(filePath),
          uploadedAt: DateTime.now(),
          success: true,
          patientName: patientName,
        );
        _uploadHistory.insert(0, record);
        _lastError = null;
        notifyListeners();
        return true;
      } else {
        _lastError = '업로드 실패 (${response.statusCode})';
        _uploadHistory.insert(0, UploadRecord(
          fileName: path.basename(filePath),
          uploadedAt: DateTime.now(),
          success: false,
          error: _lastError,
        ));
        notifyListeners();
        return false;
      }
    } catch (e) {
      _lastError = '업로드 오류: $e';
      _uploadHistory.insert(0, UploadRecord(
        fileName: path.basename(filePath),
        uploadedAt: DateTime.now(),
        success: false,
        error: _lastError,
      ));
      notifyListeners();
      return false;
    }
  }
}

/// 업로드 기록
class UploadRecord {
  final String fileName;
  final DateTime uploadedAt;
  final bool success;
  final String? patientName;
  final String? error;

  UploadRecord({
    required this.fileName,
    required this.uploadedAt,
    required this.success,
    this.patientName,
    this.error,
  });
}
