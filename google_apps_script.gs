// ════════════════════════════════════════════════════════════════
//  픽유어굿즈 POD 주문 수신 스크립트
//  이 코드를 Google Apps Script (script.google.com) 에 붙여넣으세요
//
//  ⚠️ 코드 수정 후 반드시 재배포 필요:
//  배포 → 배포 관리 → ✏️ 수정 → 버전: [새 버전] → 배포
// ════════════════════════════════════════════════════════════════

// ⚙️  받을 이메일 주소 (변경하지 않아도 됩니다)
const OWNER_EMAIL = 'dktex0514@gmail.com';

// ⚙️  주문 파일이 저장될 Google Drive 폴더 이름
const FOLDER_NAME = '픽유어굿즈_주문';


// ────────────────────────────────────────────────────────────────
//  POST 요청 처리 (캔버스 에디터에서 '전송하기' 버튼을 누를 때 호출됨)
// ────────────────────────────────────────────────────────────────
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);

    // ── AI 스타일 변환 요청 분기 ──
    if (data.action === 'ai_transform') {
      return handleAITransform(data);
    }

    // ── Gemini 이미지 변환 요청 분기 ──
    if (data.action === 'gemini_transform') {
      return handleGeminiTransform(data);
    }

    // ── 누끼따기 (Remove.bg) 요청 분기 ──
    if (data.action === 'remove_bg') {
      return handleRemoveBg(data);
    }

    const name              = data.name              || '(이름 없음)';
    const phone             = data.phone             || '(연락처 없음)';
    const email             = data.email             || '';
    const imageData         = data.imageData;
    const customerImageData = data.customerImageData || null;
    const preview3dHtml     = data.preview3dHtml     || null;

    // 1) Google Drive 에 이미지 저장
    const folder   = getOrCreateFolder(FOLDER_NAME);
    const filename = name + '_' + phone.replace(/[^0-9]/g,'') + '_' + getTimestamp() + '.png';
    const blob     = Utilities.newBlob(
      Utilities.base64Decode(imageData),
      'image/png',
      filename
    );
    const file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    const fileUrl = file.getUrl();

    // 2) 사장님 이메일로 주문 알림 발송
    const ownerHtml =
      '<div style="font-family:\'Noto Sans KR\',sans-serif; max-width:520px;">' +
      '<h2 style="color:#111;border-bottom:2px solid #111;padding-bottom:8px;">📦 새 주문이 접수되었습니다</h2>' +
      '<table style="border-collapse:collapse;width:100%;margin-top:16px;">' +
      '<tr><td style="padding:8px 12px;background:#f5f5f5;font-weight:700;width:120px;">주문자 이름</td>' +
      '<td style="padding:8px 12px;border-bottom:1px solid #eee;">' + name + '</td></tr>' +
      '<tr><td style="padding:8px 12px;background:#f5f5f5;font-weight:700;">연락처</td>' +
      '<td style="padding:8px 12px;border-bottom:1px solid #eee;">' + phone + '</td></tr>' +
      '<tr><td style="padding:8px 12px;background:#f5f5f5;font-weight:700;">이메일</td>' +
      '<td style="padding:8px 12px;border-bottom:1px solid #eee;">' + email + '</td></tr>' +
      '<tr><td style="padding:8px 12px;background:#f5f5f5;font-weight:700;">디자인 파일</td>' +
      '<td style="padding:8px 12px;">' +
      '<a href="' + fileUrl + '" style="color:#0a6cf5;font-weight:700;">여기를 클릭하여 확인</a></td></tr>' +
      '</table>' +
      '<p style="margin-top:20px;font-size:13px;color:#888;">접수 시각: ' + getTimestamp() + '</p>' +
      '</div>';

    MailApp.sendEmail({
      to:       OWNER_EMAIL,
      subject:  '[픽유어굿즈] 새 주문 — ' + name + ' / ' + phone,
      htmlBody: ownerHtml,
    });

    // 3) 고객 확인 이메일 발송 (작업물 이미지 + 3D 미리보기 첨부)
    if (email) {
      // 첨부파일 준비
      const attachments = [];
      let attachNote = '';

      if (customerImageData) {
        attachments.push(Utilities.newBlob(
          Utilities.base64Decode(customerImageData), 'image/png', '작업물_가이드포함.png'
        ));
        attachNote +=
          '<div style="margin-top:20px;padding:14px;background:#f5f9ff;border-left:4px solid #0a6cf5;border-radius:4px;">' +
          '<p style="font-weight:700;margin-bottom:4px;">📎 첨부파일 1: 작업물_가이드포함.png</p>' +
          '<p style="font-size:12px;color:#555;">고객님의 작업물 이미지입니다.<br>' +
          '빨간 점선 = 블리드(재단 여유 영역) / 검정 점선 = 안전 인쇄 영역</p>' +
          '</div>';
      }

      if (preview3dHtml) {
        attachments.push(Utilities.newBlob(
          Utilities.base64Decode(preview3dHtml), 'text/html', '3D_인터랙티브미리보기.html'
        ));
        attachNote +=
          '<div style="margin-top:10px;padding:14px;background:#f5fff5;border-left:4px solid #22a06b;border-radius:4px;">' +
          '<p style="font-weight:700;margin-bottom:4px;">📎 첨부파일 2: 3D_인터랙티브미리보기.html</p>' +
          '<p style="font-size:12px;color:#555;">첨부된 HTML 파일을 더블클릭하여 브라우저로 열면,<br>' +
          '캔버스를 <strong>마우스로 드래그해서 360° 회전</strong>하며 확인하실 수 있습니다! 🎉<br>' +
          '(인터넷 연결 필요)</p>' +
          '</div>';
      }

      const customerHtml =
        '<div style="font-family:\'Noto Sans KR\',sans-serif; max-width:560px; color:#222;">' +
        '<h2 style="color:#111;border-bottom:2px solid #111;padding-bottom:8px;">✅ 주문이 접수되었습니다!</h2>' +
        '<p style="margin-top:16px;">안녕하세요, <strong>' + name + '</strong>님!</p>' +
        '<p style="margin-top:12px; line-height:1.8;">' +
        '정성을 담은 픽유어굿즈, 주문 접수가 완료되었습니다.<br><br>' +
        '혹시 디자인 수정이 필요하신가요? 저희 픽유어굿즈는 고객님의 만족을 위해 제작 시작 전까지 자유로운 수정을 지원합니다.' +
        '</p>' +
        '<ul style="margin-top:14px; line-height:2; padding-left:20px;">' +
        '<li><strong>수정 안내:</strong> 별도로 연락하실 필요 없이, 오전 9시 전까지 아래 링크를 통해 새로 디자인을 접수해 주세요.</li>' +
        '<li><strong>제작 기준:</strong> 주문 다음 날 오전 9시에 가장 마지막으로 보내주신 디자인을 기준으로 제작에 들어갑니다.</li>' +
        '<li><strong>수정 링크:</strong> <a href="https://pickyourgoods.netlify.app/" style="color:#0a6cf5;">https://pickyourgoods.netlify.app/</a></li>' +
        '</ul>' +
        attachNote +
        '<p style="margin-top:20px; font-weight:700;">예쁘게 제작해서 보내드리겠습니다. 감사합니다! 🙏</p>' +
        '<div style="margin-top:20px;padding:16px;background:#f9f9f9;border-radius:8px;">' +
        '<p style="font-weight:700;margin-bottom:8px;">📋 접수 정보</p>' +
        '<p>이름: ' + name + '</p>' +
        '<p>연락처: ' + phone + '</p>' +
        '</div>' +
        '<p style="margin-top:24px;font-size:12px;color:#aaa;">문의사항이 있으시면 ' + OWNER_EMAIL + ' 로 연락주세요.</p>' +
        '</div>';

      MailApp.sendEmail({
        to:          email,
        subject:     '[픽유어굿즈] 주문 접수 확인 — ' + name + '님',
        htmlBody:    customerHtml,
        attachments: attachments,
      });
    }

    return jsonResponse({ success: true });

  } catch (err) {
    return jsonResponse({ success: false, error: err.message });
  }
}


// ────────────────────────────────────────────────────────────────
//  유틸 함수
// ────────────────────────────────────────────────────────────────
function getOrCreateFolder(name) {
  const iter = DriveApp.getFoldersByName(name);
  return iter.hasNext() ? iter.next() : DriveApp.createFolder(name);
}

function getTimestamp() {
  const d = new Date();
  const pad = n => String(n).padStart(2, '0');
  return d.getFullYear() + '-' + pad(d.getMonth()+1) + '-' + pad(d.getDate()) +
         ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}


// ────────────────────────────────────────────────────────────────
//  ✨ Gemini AI 이미지 변환
//
//  사용 전 설정 방법:
//  1. https://aistudio.google.com 에서 API 키 무료 발급
//  2. GAS 에디터 → 프로젝트 설정 → 스크립트 속성 → 속성 추가
//     속성명: GEMINI_API_KEY   값: AIza...
// ────────────────────────────────────────────────────────────────
function handleGeminiTransform(data) {
  try {
    const apiKey = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');
    if (!apiKey) {
      return jsonResponse({
        success: false,
        error: 'GEMINI_API_KEY가 설정되지 않았습니다.\n\nGAS 에디터 → 프로젝트 설정 → 스크립트 속성에서\n"GEMINI_API_KEY" 를 추가해주세요.\n\nhttps://aistudio.google.com 에서 무료로 발급받을 수 있습니다.'
      });
    }

    if (!data.imageData) {
      return jsonResponse({ success: false, error: '이미지 데이터가 없습니다.' });
    }

    const prompt = data.prompt || 'Convert this photo into an artistic illustration style. Keep the subject recognizable.';
    const mimeType = data.mimeType || 'image/jpeg';

    const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent?key=' + apiKey;

    const payload = {
      contents: [{
        parts: [
          { inline_data: { mime_type: mimeType, data: data.imageData } },
          { text: prompt }
        ]
      }],
      generationConfig: {
        responseModalities: ['IMAGE', 'TEXT']
      }
    };

    const response = UrlFetchApp.fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });

    const code = response.getResponseCode();
    const responseText = response.getContentText();

    if (code !== 200) {
      return jsonResponse({
        success: false,
        error: 'Gemini API 오류 (HTTP ' + code + '): ' + responseText.substring(0, 500)
      });
    }

    const result = JSON.parse(responseText);

    // 응답에서 이미지 데이터 추출
    const parts = result.candidates &&
                  result.candidates[0] &&
                  result.candidates[0].content &&
                  result.candidates[0].content.parts;

    if (!parts) {
      return jsonResponse({ success: false, error: '이미지 생성에 실패했습니다. (응답에 candidates 없음)' });
    }

    let imageData = null;
    let imageMime = 'image/png';
    for (var i = 0; i < parts.length; i++) {
      if (parts[i].inlineData && parts[i].inlineData.data) {
        imageData = parts[i].inlineData.data;
        imageMime = parts[i].inlineData.mimeType || 'image/png';
        break;
      }
    }

    if (!imageData) {
      return jsonResponse({ success: false, error: 'Gemini가 이미지를 반환하지 않았습니다. 프롬프트를 확인하거나 다시 시도해주세요.' });
    }

    return jsonResponse({ success: true, imageData: imageData, mimeType: imageMime });

  } catch (err) {
    return jsonResponse({ success: false, error: 'Gemini 변환 오류: ' + err.message });
  }
}


// ────────────────────────────────────────────────────────────────
//  ✂️  누끼따기 (Remove.bg API)
//
//  사용 전 설정 방법:
//  1. https://www.remove.bg/api 에서 무료 API 키 발급 (월 50장 무료)
//  2. GAS 에디터 → 프로젝트 설정 → 스크립트 속성 → 속성 추가
//     속성명: REMOVE_BG_API_KEY   값: 발급받은 키
// ────────────────────────────────────────────────────────────────
function handleRemoveBg(data) {
  try {
    const apiKey = PropertiesService.getScriptProperties().getProperty('REMOVE_BG_API_KEY');
    if (!apiKey) {
      return jsonResponse({
        success: false,
        error: 'REMOVE_BG_API_KEY가 설정되지 않았습니다.\n\nGAS 에디터 → 프로젝트 설정 → 스크립트 속성에서\n"REMOVE_BG_API_KEY" 를 추가해주세요.\n\nhttps://www.remove.bg/api 에서 무료로 발급받을 수 있습니다.'
      });
    }

    if (!data.imageData) {
      return jsonResponse({ success: false, error: '이미지 데이터가 없습니다.' });
    }

    const response = UrlFetchApp.fetch('https://api.remove.bg/v1.0/removebg', {
      method: 'POST',
      headers: { 'X-Api-Key': apiKey },
      payload: {
        'image_file_b64': data.imageData,
        'size': 'auto',
        'format': 'png',
      },
      muteHttpExceptions: true,
    });

    const code = response.getResponseCode();
    if (code !== 200) {
      const errText = response.getContentText();
      return jsonResponse({
        success: false,
        error: 'Remove.bg 오류 (HTTP ' + code + '): ' + errText.substring(0, 400)
      });
    }

    const resultBase64 = Utilities.base64Encode(response.getContent());
    return jsonResponse({ success: true, imageData: resultBase64, mimeType: 'image/png' });

  } catch (err) {
    return jsonResponse({ success: false, error: '누끼따기 오류: ' + err.message });
  }
}


// ────────────────────────────────────────────────────────────────
//  🔍 Gemini 설정 테스트 함수 (GAS 에디터에서 직접 실행)
//
//  사용법:
//  1. GAS 에디터 상단 함수 선택 드롭다운에서 [testGeminiSetup] 선택
//  2. ▶ 실행 클릭
//  3. 하단 [실행 로그] 에서 결과 확인
// ────────────────────────────────────────────────────────────────
function testGeminiSetup() {
  const apiKey = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');
  if (!apiKey) {
    Logger.log('❌ GEMINI_API_KEY 가 스크립트 속성에 없습니다!');
    Logger.log('   GAS 에디터 → 프로젝트 설정 → 스크립트 속성 → 속성 추가');
    Logger.log('   속성명: GEMINI_API_KEY   값: AIza...');
    return;
  }
  Logger.log('✅ API 키 발견: ' + apiKey.substring(0, 12) + '...');

  // 텍스트 응답으로 연결 확인
  const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent?key=' + apiKey;
  const testPayload = {
    contents: [{ parts: [{ text: 'Say "OK" in one word only.' }] }]
  };

  const res = UrlFetchApp.fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    payload: JSON.stringify(testPayload),
    muteHttpExceptions: true
  });

  const code = res.getResponseCode();
  Logger.log('Gemini 응답 코드: ' + code);
  if (code === 200) {
    Logger.log('🎉 Gemini API 연결 성공! AI 이미지 자동 변환을 사용할 수 있습니다.');
  } else {
    Logger.log('응답 내용: ' + res.getContentText().substring(0, 300));
    Logger.log('⚠️  위 오류 내용을 확인하세요. API 키가 올바른지 확인해주세요.');
  }
}


// ────────────────────────────────────────────────────────────────
//  🔍 AI 설정 테스트 함수 (GAS 에디터에서 직접 실행)
//
//  사용법:
//  1. GAS 에디터 상단 함수 선택 드롭다운에서 [testAISetup] 선택
//  2. ▶ 실행 클릭
//  3. 하단 [실행 로그] 에서 결과 확인
// ────────────────────────────────────────────────────────────────
function testAISetup() {
  // ① API 키 존재 확인
  const apiKey = PropertiesService.getScriptProperties().getProperty('STABILITY_API_KEY');
  if (!apiKey) {
    Logger.log('❌ STABILITY_API_KEY 가 스크립트 속성에 없습니다!');
    Logger.log('   GAS 에디터 → 프로젝트 설정 → 스크립트 속성 → 속성 추가');
    Logger.log('   속성명: STABILITY_API_KEY   값: sk-...');
    return;
  }
  Logger.log('✅ API 키 발견: ' + apiKey.substring(0, 12) + '...');

  // ② API 키 유효성 + 크레딧 잔액 확인
  const balRes = UrlFetchApp.fetch('https://api.stability.ai/v1/user/balance', {
    method: 'GET',
    headers: { 'Authorization': 'Bearer ' + apiKey },
    muteHttpExceptions: true,
  });

  const balCode = balRes.getResponseCode();
  if (balCode !== 200) {
    Logger.log('❌ API 키가 유효하지 않습니다. (HTTP ' + balCode + ')');
    Logger.log('   응답: ' + balRes.getContentText().substring(0, 200));
    Logger.log('   → platform.stability.ai 에서 새 API 키를 발급받으세요.');
    return;
  }

  const balData = JSON.parse(balRes.getContentText());
  const credits = balData.credits || 0;
  Logger.log('✅ API 키 유효!  보유 크레딧: ' + credits.toFixed(2));

  if (credits < 3.5) {
    Logger.log('⚠️  크레딧 부족! (SD3-medium 1회 = 3.5 크레딧 필요)');
    Logger.log('   platform.stability.ai → Billing 에서 크레딧을 충전하세요.');
    return;
  }
  Logger.log('✅ 크레딧 충분. 약 ' + Math.floor(credits / 3.5) + '회 변환 가능');

  // ③ SD3 img2img 엔드포인트 실제 호출 테스트 (1x1 픽셀 투명 PNG)
  Logger.log('--- SD3 img2img 엔드포인트 연결 테스트 중... ---');
  const minPng = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  const imgBlob = Utilities.newBlob(Utilities.base64Decode(minPng), 'image/png', 'test.png');

  const testRes = UrlFetchApp.fetch('https://api.stability.ai/v2beta/stable-image/control/structure', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + apiKey, 'Accept': 'image/*' },
    payload: {
      image:            imgBlob,
      prompt:           'test illustration',
      control_strength: '0.85',
      output_format:    'png',
    },
    muteHttpExceptions: true,
  });

  const testCode = testRes.getResponseCode();
  Logger.log('SD3 응답 코드: ' + testCode);
  if (testCode === 200) {
    Logger.log('🎉 모든 설정 완료! AI 변환 기능을 사용할 수 있습니다.');
  } else {
    Logger.log('응답 내용: ' + testRes.getContentText().substring(0, 300));
    Logger.log('⚠️  위 오류 내용을 캡처해서 공유해주세요.');
  }
}


// ────────────────────────────────────────────────────────────────
//  ✨ AI 스타일 변환 (Stability AI)
//
//  사용 전 설정 방법:
//  1. https://platform.stability.ai 에서 API 키 발급
//  2. GAS 에디터 → 프로젝트 설정 → 스크립트 속성 → 속성 추가
//     속성명: STABILITY_API_KEY   값: sk-xxxxxxxx...
// ────────────────────────────────────────────────────────────────
function handleAITransform(data) {
  try {
    // API 키 가져오기 (스크립트 속성에서)
    const apiKey = PropertiesService.getScriptProperties().getProperty('STABILITY_API_KEY');
    if (!apiKey) {
      return jsonResponse({
        success: false,
        error: 'STABILITY_API_KEY가 설정되지 않았습니다.\n\nGAS 에디터 → 프로젝트 설정 → 스크립트 속성에서\n"STABILITY_API_KEY" 를 추가해주세요.\n\nhttps://platform.stability.ai 에서 API 키를 발급받을 수 있습니다.'
      });
    }

    if (!data.imageData) {
      return jsonResponse({ success: false, error: '이미지 데이터가 없습니다.' });
    }

    // 스타일 프롬프트에 품질 키워드 추가
    const prompt = (data.prompt || 'artistic illustration style') + ', high quality, detailed';

    // 입력 이미지 Blob 생성
    const imageBytes = Utilities.base64Decode(data.imageData);
    const imageBlob  = Utilities.newBlob(imageBytes, 'image/png', 'input.png');

    // ✅ SD3 image-to-image, strength 0.60
    //    원본 이미지를 40% 유지 + 스타일 60% 적용
    //    → 강아지 모양·포즈 유지하면서 웹툰/수채화 스타일로 변환
    const response = UrlFetchApp.fetch(
      'https://api.stability.ai/v2beta/stable-image/generate/sd3',
      {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + apiKey,
          'Accept': 'image/*',
        },
        payload: {
          mode:          'image-to-image',
          image:         imageBlob,
          prompt:        prompt,
          strength:      '0.60',   // 0=원본유지, 1=완전새이미지 → 0.60이 스타일변환 최적
          model:         'sd3-medium',
          output_format: 'png',
        },
        muteHttpExceptions: true,
      }
    );

    const code = response.getResponseCode();
    if (code !== 200) {
      const errText = response.getContentText();
      return jsonResponse({
        success: false,
        error: 'Stability AI 오류 (HTTP ' + code + '): ' + errText.substring(0, 400)
      });
    }

    // 응답 이미지를 base64로 인코딩하여 반환
    const resultBase64 = Utilities.base64Encode(response.getContent());
    return jsonResponse({ success: true, imageData: resultBase64 });

  } catch (err) {
    return jsonResponse({ success: false, error: 'AI 변환 오류: ' + err.message });
  }
}
