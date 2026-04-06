import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:permission_handler/permission_handler.dart';
import '../services/auth_service.dart';
import '../services/recording_service.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  bool _permissionsGranted = false;

  @override
  void initState() {
    super.initState();
    _checkPermissions();
  }

  Future<void> _checkPermissions() async {
    final statuses = await [
      Permission.phone,
      Permission.storage,
      Permission.manageExternalStorage,
      Permission.notification,
    ].request();

    setState(() {
      _permissionsGranted = statuses.values.every(
        (s) => s.isGranted || s.isLimited,
      );
    });
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthService>();
    final recording = context.watch<RecordingService>();
    final recordingDir = recording.findRecordingDirectory();

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: const Text('덴비 녹음', style: TextStyle(fontWeight: FontWeight.bold)),
        backgroundColor: Colors.white,
        foregroundColor: const Color(0xFF1E293B),
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.logout, size: 20),
            onPressed: () => auth.logout(),
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // 사용자 정보
            _buildCard(
              icon: Icons.person,
              iconColor: const Color(0xFF1A56DB),
              title: '${auth.userName}님',
              subtitle: '서버: ${auth.serverUrl}',
            ),
            const SizedBox(height: 16),

            // 권한 상태
            _buildCard(
              icon: _permissionsGranted ? Icons.check_circle : Icons.warning,
              iconColor: _permissionsGranted ? Colors.green : Colors.orange,
              title: _permissionsGranted ? '권한 설정 완료' : '권한 설정 필요',
              subtitle: _permissionsGranted
                  ? '전화, 저장소, 알림 권한이 허용되었습니다'
                  : '앱이 정상 작동하려면 권한을 허용해주세요',
              action: !_permissionsGranted
                  ? TextButton(
                      onPressed: _checkPermissions,
                      child: const Text('권한 설정'),
                    )
                  : null,
            ),
            const SizedBox(height: 16),

            // 녹음 폴더
            _buildCard(
              icon: Icons.folder,
              iconColor: recordingDir != null ? Colors.green : Colors.red,
              title: recordingDir != null ? '녹음 폴더 감지됨' : '녹음 폴더 없음',
              subtitle: recordingDir ?? '기기 설정에서 통화 녹음을 활성화해주세요',
            ),
            const SizedBox(height: 24),

            // 모니터링 토글
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(
                  color: recording.isMonitoring
                      ? const Color(0xFF1A56DB).withAlpha(77)
                      : Colors.grey.shade200,
                ),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withAlpha(8),
                    blurRadius: 10,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: Column(
                children: [
                  Icon(
                    recording.isMonitoring ? Icons.mic : Icons.mic_off,
                    size: 48,
                    color: recording.isMonitoring
                        ? const Color(0xFF1A56DB)
                        : Colors.grey.shade400,
                  ),
                  const SizedBox(height: 12),
                  Text(
                    recording.isMonitoring ? '자동 업로드 활성화' : '자동 업로드 비활성화',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: recording.isMonitoring
                          ? const Color(0xFF1E293B)
                          : Colors.grey.shade500,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    recording.isMonitoring
                        ? '통화 종료 시 녹음이 자동으로 업로드됩니다'
                        : '터치하여 자동 업로드를 시작하세요',
                    style: TextStyle(fontSize: 13, color: Colors.grey.shade500),
                  ),
                  const SizedBox(height: 20),
                  SizedBox(
                    width: double.infinity,
                    height: 48,
                    child: ElevatedButton(
                      onPressed: _permissionsGranted && recordingDir != null
                          ? () {
                              if (recording.isMonitoring) {
                                recording.stopMonitoring();
                              } else {
                                recording.startMonitoring();
                              }
                            }
                          : null,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: recording.isMonitoring
                            ? Colors.red.shade400
                            : const Color(0xFF1A56DB),
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      child: Text(
                        recording.isMonitoring ? '중지' : '시작',
                        style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
                      ),
                    ),
                  ),
                ],
              ),
            ),

            // 에러
            if (recording.lastError != null) ...[
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.red.shade50,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  children: [
                    Icon(Icons.error_outline, size: 16, color: Colors.red.shade700),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        recording.lastError!,
                        style: TextStyle(fontSize: 12, color: Colors.red.shade700),
                      ),
                    ),
                  ],
                ),
              ),
            ],

            const SizedBox(height: 24),

            // 업로드 이력
            Text(
              '최근 업로드',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
                color: Colors.grey.shade800,
              ),
            ),
            const SizedBox(height: 12),

            if (recording.uploadHistory.isEmpty)
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(32),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Colors.grey.shade200),
                ),
                child: Column(
                  children: [
                    Icon(Icons.cloud_upload_outlined, size: 40, color: Colors.grey.shade300),
                    const SizedBox(height: 8),
                    Text(
                      '아직 업로드된 녹음이 없습니다',
                      style: TextStyle(fontSize: 13, color: Colors.grey.shade500),
                    ),
                  ],
                ),
              )
            else
              ...recording.uploadHistory.take(10).map((record) => Container(
                margin: const EdgeInsets.only(bottom: 8),
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: Colors.grey.shade100),
                ),
                child: Row(
                  children: [
                    Icon(
                      record.success ? Icons.check_circle : Icons.error,
                      size: 18,
                      color: record.success ? Colors.green : Colors.red,
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            record.fileName,
                            style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500),
                            overflow: TextOverflow.ellipsis,
                          ),
                          Text(
                            record.patientName ?? _formatTime(record.uploadedAt),
                            style: TextStyle(fontSize: 11, color: Colors.grey.shade500),
                          ),
                        ],
                      ),
                    ),
                    if (record.error != null)
                      Icon(Icons.info_outline, size: 16, color: Colors.red.shade300),
                  ],
                ),
              )),
          ],
        ),
      ),
    );
  }

  Widget _buildCard({
    required IconData icon,
    required Color iconColor,
    required String title,
    required String subtitle,
    Widget? action,
  }) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey.shade100),
      ),
      child: Row(
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: iconColor.withAlpha(26),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(icon, color: iconColor, size: 20),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
                Text(subtitle, style: TextStyle(fontSize: 11, color: Colors.grey.shade500)),
              ],
            ),
          ),
          if (action != null) action,
        ],
      ),
    );
  }

  String _formatTime(DateTime dt) {
    return '${dt.hour}:${dt.minute.toString().padLeft(2, '0')}';
  }
}
