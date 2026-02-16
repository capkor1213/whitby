import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js@2";
import * as kv from "./kv_store.tsx";

const app = new Hono();

// Create Supabase client
const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
);

// Enable logger
app.use("*", logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Health check endpoint
app.get("/make-server-2c29cd73/health", (c) => {
  return c.json({ status: "ok" });
});

// Sign up endpoint
app.post("/make-server-2c29cd73/signup", async (c) => {
  try {
    const { 
      email, 
      password, 
      name, 
      phone,
      address,
      addressDetail,
      userType, 
      certification, 
      specialty,
      careerHistory,
      message,
      // Body information
      gender,
      age,
      height,
      currentWeight,
      currentMuscleMass,
      currentBodyFat,
      // Center information
      businessNumber,
      ownerName,
      introduction
    } = await c.req.json();

    if (!email || !password || !name) {
      return c.json({ error: "Email, password, and name are required" }, 400);
    }

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { 
        name,
        phone: phone || "",
        address: address || "",
        addressDetail: addressDetail || "",
        userType: userType || "member",
        certification: certification || "",
        specialty: specialty || "",
      },
      email_confirm: true,
    });

    if (error) {
      console.log(`Error creating user during signup: ${error.message}`);
      return c.json({ error: error.message }, 400);
    }

    // Save user profile to KV store
    if (data.user) {
      const userProfile = {
        name,
        email,
        phone: phone || "",
        address: address || "",
        addressDetail: addressDetail || "",
        userType: userType || "member",
        certification: certification || "",
        specialty: specialty || "",
        createdAt: new Date().toISOString(),
      };
      
      await kv.set(`user:${data.user.id}:info`, userProfile);

      // If user is a coach, also save to coach:profile
      if (userType === "coach") {
        const coachProfile = {
          id: data.user.id,
          name,
          email,
          certification: certification || "",
          specialty: specialty || "",
          profileImage: "",
          careerHistory: careerHistory || "",
          message: message || "",
          createdAt: new Date().toISOString(),
        };
        await kv.set(`coach:profile:${data.user.id}`, coachProfile);
      }

      // If user is a center, also save to center:profile
      if (userType === "center") {
        const centerProfile = {
          id: data.user.id,
          name,
          email,
          businessNumber: businessNumber || "",
          ownerName: ownerName || "",
          logo: "",
          introduction: introduction || "",
          createdAt: new Date().toISOString(),
        };
        await kv.set(`center:profile:${data.user.id}`, centerProfile);
      }

      // Save body information if provided
      if (gender || age || height || currentWeight || currentMuscleMass || currentBodyFat) {
        const bodyProfile = {
          gender: gender || "male",
          age: age || "",
          height: height || "",
          currentWeight: currentWeight || "",
          currentMuscleMass: currentMuscleMass || "",
          currentBodyFat: currentBodyFat || "",
          createdAt: new Date().toISOString(),
        };
        
        await kv.set(`user:${data.user.id}:profile`, bodyProfile);
      }
    }

    return c.json({ user: data.user });
  } catch (error) {
    console.log(`Server error during signup: ${error}`);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Save/Update user profile (body info + goals)
app.post("/make-server-2c29cd73/profile", async (c) => {
  try {
    const accessToken = c.req.header("Authorization")?.split(" ")[1];
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(accessToken);

    if (authError || !user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const profileData = await c.req.json();
    await kv.set(`user:${user.id}:profile`, profileData);

    return c.json({ success: true, profile: profileData });
  } catch (error) {
    console.log(`Error saving profile: ${error}`);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Get user profile
app.get("/make-server-2c29cd73/profile", async (c) => {
  try {
    const accessToken = c.req.header("Authorization")?.split(" ")[1];
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(accessToken);

    if (authError || !user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const profile = await kv.get(`user:${user.id}:profile`);
    return c.json({ profile });
  } catch (error) {
    console.log(`Error fetching profile: ${error}`);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Get user info (회원 정보 조회)
app.get("/make-server-2c29cd73/user-info", async (c) => {
  try {
    const accessToken = c.req.header("Authorization")?.split(" ")[1];
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(accessToken);

    if (authError || !user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const userInfo = await kv.get(`user:${user.id}:info`);
    
    // Also get user metadata from Supabase Auth
    const metadata = user.user_metadata || {};
    
    return c.json({ 
      userInfo: userInfo || {
        name: metadata.name || "",
        email: user.email || "",
        userType: metadata.userType || "member",
        certification: metadata.certification || "",
        specialty: metadata.specialty || "",
      }
    });
  } catch (error) {
    console.log(`Error fetching user info: ${error}`);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Save daily log (food + exercise)
app.post("/make-server-2c29cd73/daily-log", async (c) => {
  try {
    const accessToken = c.req.header("Authorization")?.split(" ")[1];
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(accessToken);

    if (authError || !user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const { date, foods, exercises, totalWorkoutTime } = await c.req.json();
    const logData = { date, foods, exercises, totalWorkoutTime, updatedAt: new Date().toISOString() };

    await kv.set(`user:${user.id}:daily:${date}`, logData);

    return c.json({ success: true, log: logData });
  } catch (error) {
    console.log(`Error saving daily log: ${error}`);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Get daily log for a specific date
app.get("/make-server-2c29cd73/daily-log", async (c) => {
  try {
    const accessToken = c.req.header("Authorization")?.split(" ")[1];
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(accessToken);

    if (authError || !user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const date = c.req.query("date");
    
    if (!date) {
      return c.json({ error: "Date parameter is required" }, 400);
    }

    const logData = await kv.get(`user:${user.id}:daily:${date}`);
    
    return c.json(logData);
  } catch (error) {
    console.log(`Error fetching daily log: ${error}`);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Save InBody measurement
app.post("/make-server-2c29cd73/inbody", async (c) => {
  try {
    const accessToken = c.req.header("Authorization")?.split(" ")[1];
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(accessToken);

    if (authError || !user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const { date, weight, muscleMass, bodyFat } = await c.req.json();
    const inbodyData = { date, weight, muscleMass, bodyFat, recordedAt: new Date().toISOString() };

    await kv.set(`user:${user.id}:inbody:${date}`, inbodyData);

    return c.json({ success: true, inbody: inbodyData });
  } catch (error) {
    console.log(`Error saving InBody data: ${error}`);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Get InBody measurements
app.get("/make-server-2c29cd73/inbody", async (c) => {
  try {
    const accessToken = c.req.header("Authorization")?.split(" ")[1];
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(accessToken);

    if (authError || !user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const measurements = await kv.getByPrefix(`user:${user.id}:inbody:`);
    return c.json({ measurements });
  } catch (error) {
    console.log(`Error fetching InBody data: ${error}`);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Save coach feedback
app.post("/make-server-2c29cd73/feedback", async (c) => {
  try {
    const accessToken = c.req.header("Authorization")?.split(" ")[1];
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(accessToken);

    if (authError || !user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const { weekId, feedback, coachName } = await c.req.json();
    const feedbackData = {
      weekId,
      feedback,
      coachName: coachName || "코치",
      createdAt: new Date().toISOString(),
    };

    await kv.set(`feedback:${user.id}:${weekId}`, feedbackData);

    return c.json({ success: true, feedback: feedbackData });
  } catch (error) {
    console.log(`Error saving feedback: ${error}`);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Get feedbacks for a user
app.get("/make-server-2c29cd73/feedback", async (c) => {
  try {
    const accessToken = c.req.header("Authorization")?.split(" ")[1];
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(accessToken);

    if (authError || !user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const feedbacks = await kv.getByPrefix(`feedback:${user.id}:`);
    return c.json({ feedbacks });
  } catch (error) {
    console.log(`Error fetching feedbacks: ${error}`);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Update feedback
app.put("/make-server-2c29cd73/feedback", async (c) => {
  try {
    const accessToken = c.req.header("Authorization")?.split(" ")[1];
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(accessToken);

    if (authError || !user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const { feedbackId, feedback } = await c.req.json();
    const [prefix, userId, weekId] = feedbackId.split("_");
    
    const existingFeedback = await kv.get(`feedback:${user.id}:${weekId}`);
    if (!existingFeedback) {
      return c.json({ error: "Feedback not found" }, 404);
    }

    const updatedFeedback = {
      ...existingFeedback,
      feedback,
      updatedAt: new Date().toISOString(),
    };

    await kv.set(`feedback:${user.id}:${weekId}`, updatedFeedback);

    return c.json({ success: true, feedback: updatedFeedback });
  } catch (error) {
    console.log(`Error updating feedback: ${error}`);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Generate AI feedback based on InBody changes and RIR
app.post("/make-server-2c29cd73/generate-feedback", async (c) => {
  try {
    const accessToken = c.req.header("Authorization")?.split(" ")[1];
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(accessToken);

    if (authError || !user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const { weekId } = await c.req.json();

    // Get all InBody measurements
    const measurements = await kv.getByPrefix(`user:${user.id}:inbody:`);
    if (!measurements || measurements.length === 0) {
      return c.json({ error: "인바디 기록이 없습니다. 먼저 인바디를 기록해주세요." }, 400);
    }

    // Sort measurements by date
    const sortedMeasurements = measurements
      .map((m: any) => m.value)
      .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // 현재 주차(weekId) 기준 날짜 설정
    const currentWeekStart = new Date(weekId);
    const weekEnd = new Date(currentWeekStart);
    weekEnd.setDate(currentWeekStart.getDate() + 6);
    
    // 1주 전, 2주 전 날짜
    const oneWeekAgo = new Date(currentWeekStart);
    oneWeekAgo.setDate(currentWeekStart.getDate() - 7);
    
    const twoWeeksAgo = new Date(currentWeekStart);
    twoWeeksAgo.setDate(currentWeekStart.getDate() - 14);

    // 현재 주차에 가장 가까운 인바디 기록 찾기
    let latestMeasurement = null;
    for (let i = sortedMeasurements.length - 1; i >= 0; i--) {
      const measurementDate = new Date(sortedMeasurements[i].date);
      if (measurementDate <= weekEnd) {
        latestMeasurement = sortedMeasurements[i];
        break;
      }
    }

    if (!latestMeasurement) {
      return c.json({ error: "현재 주차에 해당하는 인바디 기록이 없습니다." }, 400);
    }

    // 1주 전 기록 찾기
    let oneWeekMeasurement = null;
    let minDiff = Infinity;
    for (const measurement of sortedMeasurements) {
      const measurementDate = new Date(measurement.date);
      const diff = Math.abs(measurementDate.getTime() - oneWeekAgo.getTime());
      if (measurement.date !== latestMeasurement.date && diff < minDiff) {
        minDiff = diff;
        oneWeekMeasurement = measurement;
      }
    }

    // 2주 전 기록 찾기
    let twoWeekMeasurement = null;
    minDiff = Infinity;
    for (const measurement of sortedMeasurements) {
      const measurementDate = new Date(measurement.date);
      const diff = Math.abs(measurementDate.getTime() - twoWeeksAgo.getTime());
      if (measurement.date !== latestMeasurement.date && diff < minDiff) {
        minDiff = diff;
        twoWeekMeasurement = measurement;
      }
    }

    if (!oneWeekMeasurement && !twoWeekMeasurement) {
      return c.json({ error: "비교할 인바디 기록이 없습니다. 최소 2개의 인바디 기록이 필요합니다." }, 400);
    }

    // 비교 기준 (1주 전 우선, 없으면 2주 전)
    const previousMeasurement = oneWeekMeasurement || twoWeekMeasurement;

    // Calculate muscle mass (근육량 = 체중 - 체지방량)
    const latestMuscleMass = latestMeasurement.weight - latestMeasurement.bodyFat;
    const previousMuscleMass = previousMeasurement.weight - previousMeasurement.bodyFat;

    // Calculate changes
    const muscleMassChange = latestMuscleMass - previousMuscleMass;
    const bodyFatChange = latestMeasurement.bodyFat - previousMeasurement.bodyFat;
    const weightChange = latestMeasurement.weight - previousMeasurement.weight;

    // Get last 4 weeks' RIR data
    const fourWeeksAgo = new Date(currentWeekStart);
    fourWeeksAgo.setDate(currentWeekStart.getDate() - (3 * 7));

    const logs = await kv.getByPrefix(`user:${user.id}:daily:`);
    const rirValues: number[] = [];
    const performanceData: { exercise: string; weight: number; reps: number; volume: number }[] = [];

    logs.forEach((log: any) => {
      const logDate = new Date(log.value.date);
      if (logDate >= fourWeeksAgo && logDate <= weekEnd) {
        log.value.exercises?.forEach((ex: any) => {
          ex.sets?.forEach((set: any) => {
            if (set.rir !== undefined && set.rir !== null) {
              rirValues.push(set.rir);
            }
            // 퍼포먼스 데이터 수집 (중량 × 반복수)
            if (set.weight && set.reps) {
              performanceData.push({
                exercise: ex.name,
                weight: set.weight,
                reps: set.reps,
                volume: set.weight * set.reps,
              });
            }
          });
        });
      }
    });

    const avgRir = rirValues.length > 0 
      ? rirValues.reduce((sum, rir) => sum + rir, 0) / rirValues.length 
      : null;

    // 퍼포먼스 변화 계산 (최근 2주 vs 이전 2주)
    const recentPerformance = performanceData.slice(-Math.floor(performanceData.length / 2));
    const oldPerformance = performanceData.slice(0, Math.floor(performanceData.length / 2));
    
    const recentAvgVolume = recentPerformance.length > 0
      ? recentPerformance.reduce((sum, p) => sum + p.volume, 0) / recentPerformance.length
      : 0;
    const oldAvgVolume = oldPerformance.length > 0
      ? oldPerformance.reduce((sum, p) => sum + p.volume, 0) / oldPerformance.length
      : 0;
    
    const performanceChange = oldAvgVolume > 0 
      ? ((recentAvgVolume - oldAvgVolume) / oldAvgVolume) * 100 
      : 0;

    // 변화 방향 판단 (기준: ±0.3kg)
    const muscleDirection = muscleMassChange > 0.3 ? "증가" : muscleMassChange < -0.3 ? "감소" : "유지";
    const fatDirection = bodyFatChange > 0.3 ? "증가" : bodyFatChange < -0.3 ? "감소" : "유지";
    const performanceDirection = performanceChange > 5 ? "증가" : performanceChange < -5 ? "감소" : "유지";

    // ========== 통합 조절 시스템 ==========
    let situation = "";
    let calorieAdjustment = "유지";
    let proteinAdjustment = "1.6–2.2 g/kg 유지";
    let carbAdjustment = "유지";
    let trainingIntensity = "유지";
    let trainingVolume = "유지";
    let cardioAdjustment = "유지";
    let interpretation = "";
    let warnings: string[] = [];

    // 1. 체성분 변화별 기본 조절
    if (muscleDirection === "증가" && fatDirection === "감소") {
      // ① 최적 상태
      situation = "최적 재조합";
      interpretation = "현재 전략이 매우 효과적입니다. 동일한 섭취량과 훈련 강도를 유지하세요.";
      calorieAdjustment = "유지";
      proteinAdjustment = "1.6–2.2 g/kg 유지";
      carbAdjustment = "유지";
      trainingIntensity = "유지 또는 +2~3%";
      trainingVolume = "유지";
      cardioAdjustment = "유지";
    } else if (muscleDirection === "증가" && fatDirection === "증가") {
      // ② 과잉 상태
      situation = "과잉 상태";
      interpretation = "근성장은 잘 이루어지고 있습니다. 다만 체지방 증가 속도가 권장 범위를 초과했습니다. 탄수화물 또는 총칼로리를 소폭 조정하고 유산소를 추가하세요.";
      calorieAdjustment = "−5~10%";
      proteinAdjustment = "유지";
      carbAdjustment = "−5~10%";
      trainingIntensity = "유지";
      trainingVolume = "유지";
      cardioAdjustment = "+10~20%";
    } else if (muscleDirection === "감소" && fatDirection === "감소") {
      // ③ 과도한 적자 (근손실 위험)
      situation = "과도한 칼로리 적자";
      interpretation = "현재 감량 속도가 근손실 위험 범위에 있습니다. 단백질 섭취와 탄수화물을 늘리고 훈련 볼륨을 일시적으로 낮추는 것이 필요합니다.";
      calorieAdjustment = "+5~10%";
      proteinAdjustment = "상한선(≈2.2 g/kg)";
      carbAdjustment = "+10~20%";
      trainingIntensity = "감소 금지 (유지)";
      trainingVolume = "−10~20% 감소";
      cardioAdjustment = "감소";
      warnings.push("⚠️ 근손실 위험");
    } else if (muscleDirection === "감소" && fatDirection === "증가") {
      // ④ 가장 위험한 상태
      situation = "비효율적 체성분 변화";
      interpretation = "체성분 변화가 비효율적인 방향으로 진행 중입니다. 섭취 열량 과다 또는 훈련 자극 부족 가능성이 높습니다. 훈련 구조 재설계와 열량 조정이 필요합니다.";
      calorieAdjustment = "−10~20%";
      proteinAdjustment = "FFM 기준 상한";
      carbAdjustment = "RIR 기준 재설정";
      trainingIntensity = "재구성 필요";
      trainingVolume = "감소 후 점진 증가";
      cardioAdjustment = "중강도 추가";
      warnings.push("🚨 위험: 근육 감소 + 지방 증가");
    } else {
      // 기타 정상 범위
      situation = "정상 범위";
      interpretation = "현재 진행 상태가 안정적입니다. 큰 변화 없이 현재 전략을 유지하세요.";
    }

    // 2. RIR 기반 훈련 강도 조절
    if (avgRir !== null) {
      if (avgRir >= 3) {
        trainingIntensity = "중량 +2~5% (자극 부족)";
        warnings.push("💡 RIR이 높습니다. 중량을 올려보세요.");
      } else if (avgRir <= 0.5) {
        trainingVolume = "볼륨 −10~20% (피로 과다)";
        warnings.push("⚠️ RIR이 너무 낮습니다. 과훈련 주의!");
      }
    }

    // 3. 퍼포먼스 변화 기반 조절
    if (performanceDirection === "감소" && performanceChange < -10) {
      warnings.push("⚠️ 퍼포먼스 10% 이상 하락 감지");
      carbAdjustment = "+10~15% (에너지 부족)";
      trainingVolume = "디로드 주간 권장";
    }

    // 4. 2주 연속 근손실 체크 (이전 피드백 기록 확인)
    const previousFeedbacks = await kv.getByPrefix(`feedback:${user.id}:`);
    const recentFeedbacks = previousFeedbacks
      .map((f: any) => f.value)
      .sort((a: any, b: any) => new Date(b.weekId).getTime() - new Date(a.weekId).getTime())
      .slice(0, 2);

    if (recentFeedbacks.length >= 1) {
      const lastFeedback = recentFeedbacks[0];
      if (lastFeedback.analysis?.muscleDirection === "감소" && muscleDirection === "감소") {
        warnings.push("🚨 2주 연속 근육 감소 경고!");
        proteinAdjustment = "즉시 상향 (2.2 g/kg 이상)";
        trainingVolume = "−20% 감소";
        calorieAdjustment = "+10%";
      }
    }

    // 5. 체지방 급증 체크 (주당 +0.5kg 이상)
    const weeksDiff = Math.abs((new Date(latestMeasurement.date).getTime() - new Date(previousMeasurement.date).getTime()) / (7 * 24 * 60 * 60 * 1000));
    const fatChangePerWeek = bodyFatChange / Math.max(weeksDiff, 1);
    
    if (fatChangePerWeek > 0.5) {
      warnings.push("🚨 체지방 급증 경고 (주당 +0.5kg 초과)");
      calorieAdjustment = "즉시 −10%";
    }

    // 6. 디로드 자동 발동 조건
    const shouldDeload = (
      (avgRir !== null && avgRir <= 0.5 && performanceChange < -10) ||
      (performanceDirection === "감소" && muscleDirection === "감소")
    );

    if (shouldDeload) {
      warnings.push("🔄 디로드 주간 자동 발동 권장");
      trainingVolume = "−40~50% (1주간)";
      trainingIntensity = "유지 (강도는 그대로)";
    }

    // Generate feedback text
    const feedbackText = `📊 주간 체성분 분석 결과

🔍 측정 변화 (${previousMeasurement.date} → ${latestMeasurement.date})
• 근육량: ${previousMuscleMass.toFixed(1)}kg → ${latestMuscleMass.toFixed(1)}kg (${muscleMassChange >= 0 ? '+' : ''}${muscleMassChange.toFixed(1)}kg) [${muscleDirection}]
• 체지방량: ${previousMeasurement.bodyFat.toFixed(1)}kg → ${latestMeasurement.bodyFat.toFixed(1)}kg (${bodyFatChange >= 0 ? '+' : ''}${bodyFatChange.toFixed(1)}kg) [${fatDirection}]
• 체중: ${previousMeasurement.weight.toFixed(1)}kg → ${latestMeasurement.weight.toFixed(1)}kg (${weightChange >= 0 ? '+' : ''}${weightChange.toFixed(1)}kg)
• 평균 RIR (최근 4주): ${avgRir !== null ? avgRir.toFixed(1) : 'N/A'}
• 퍼포먼스 변화: ${performanceChange >= 0 ? '+' : ''}${performanceChange.toFixed(1)}% [${performanceDirection}]

📈 종합 평가
상태: ${situation}

${interpretation}

💡 통합 조절 권장사항

🍽️ 영양 조절
• 칼로리: ${calorieAdjustment}
• 단백질: ${proteinAdjustment}
• 탄수화물: ${carbAdjustment}

🏋️ 훈련 조절
• 웨이트 강도: ${trainingIntensity}
• 훈련 볼륨: ${trainingVolume}
• 유산소량: ${cardioAdjustment}

${warnings.length > 0 ? `\n⚠️ 경고 알림\n${warnings.join('\n')}` : ''}`;

    return c.json({ 
      success: true, 
      feedback: feedbackText,
      analysis: {
        muscleMassChange,
        bodyFatChange,
        weightChange,
        avgRir,
        performanceChange,
        muscleDirection,
        fatDirection,
        performanceDirection,
        situation,
        interpretation,
        adjustments: {
          calorie: calorieAdjustment,
          protein: proteinAdjustment,
          carb: carbAdjustment,
          trainingIntensity,
          trainingVolume,
          cardio: cardioAdjustment,
        },
        warnings,
        shouldDeload,
      }
    });
  } catch (error) {
    console.log(`Error generating feedback: ${error}`);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Get all coaches
app.get("/make-server-2c29cd73/coaches", async (c) => {
  try {
    const coachesData = await kv.getByPrefix("coach:profile:");
    
    // Transform the data - getByPrefix returns array of {key, value}
    const coachList = coachesData.map((item: any) => {
      const coach = item.value || item;
      return {
        id: coach.id || "",
        name: coach.name || "",
        email: coach.email || "",
        certification: coach.certification || "",
        specialty: coach.specialty || "",
        profileImage: coach.profileImage || "",
        careerHistory: coach.careerHistory || "",
        message: coach.message || "",
        gender: coach.gender || "",
        location: coach.location || "",
        createdAt: coach.createdAt || "",
      };
    });

    return c.json({ coaches: coachList });
  } catch (error) {
    console.log(`Error fetching coaches: ${error}`);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Get all centers
app.get("/make-server-2c29cd73/centers", async (c) => {
  try {
    const centersData = await kv.getByPrefix("center:profile:");
    
    // Transform the data - getByPrefix returns array of {key, value}
    const centerList = centersData.map((item: any) => {
      const center = item.value || item;
      return {
        id: center.id || "",
        name: center.name || "",
        email: center.email || "",
        businessNumber: center.businessNumber || "",
        ownerName: center.ownerName || "",
        logo: center.logo || "",
        introduction: center.introduction || "",
        address: center.address || "",
        createdAt: center.createdAt || "",
      };
    });

    return c.json({ centers: centerList });
  } catch (error) {
    console.log(`Error fetching centers: ${error}`);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Update coach profile
app.put("/make-server-2c29cd73/coaches/:id", async (c) => {
  try {
    const coachId = c.req.param("id");
    const { profileImage, careerHistory, message } = await c.req.json();

    // Get existing coach data
    const existingCoach = await kv.get(`coach:profile:${coachId}`);
    
    if (!existingCoach) {
      return c.json({ error: "Coach not found" }, 404);
    }

    // Update coach profile
    const updatedCoach = {
      ...existingCoach,
      profileImage: profileImage || existingCoach.profileImage || "",
      careerHistory: careerHistory || "",
      message: message || "",
      updatedAt: new Date().toISOString(),
    };

    await kv.set(`coach:profile:${coachId}`, updatedCoach);

    return c.json({ success: true, coach: updatedCoach });
  } catch (error) {
    console.log(`Error updating coach profile: ${error}`);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Upload coach profile image
app.post("/make-server-2c29cd73/coaches/upload-image", async (c) => {
  try {
    const formData = await c.req.formData();
    const file = formData.get("file") as File;
    const coachId = formData.get("coachId") as string;

    if (!file || !coachId) {
      return c.json({ error: "File and coachId are required" }, 400);
    }

    // Ensure bucket exists
    const bucketName = "make-2c29cd73-coach-profiles";
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some((bucket) => bucket.name === bucketName);
    
    if (!bucketExists) {
      await supabase.storage.createBucket(bucketName, {
        public: false,
        fileSizeLimit: 5242880, // 5MB
      });
    }

    // Convert file to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    // Generate unique filename
    const timestamp = Date.now();
    const fileExt = file.name.split(".").pop();
    const fileName = `${coachId}_${timestamp}.${fileExt}`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(fileName, uint8Array, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      console.log(`Error uploading image: ${uploadError.message}`);
      return c.json({ error: uploadError.message }, 500);
    }

    // Get signed URL (valid for 1 year)
    const { data: urlData } = await supabase.storage
      .from(bucketName)
      .createSignedUrl(fileName, 31536000); // 365 days

    return c.json({ 
      success: true, 
      imageUrl: urlData?.signedUrl || "",
      fileName: fileName 
    });
  } catch (error) {
    console.log(`Error in upload-image endpoint: ${error}`);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Delete coach profile image
app.delete("/make-server-2c29cd73/coaches/:id/delete-image", async (c) => {
  try {
    const coachId = c.req.param("id");
    
    // Get coach data to find the image file
    const coach = await kv.get(`coach:profile:${coachId}`);
    
    if (!coach || !coach.profileImage) {
      return c.json({ error: "No image to delete" }, 404);
    }

    // Extract filename from URL (assuming it follows the pattern)
    // This is a simple implementation - you might want to store the filename separately
    
    return c.json({ success: true });
  } catch (error) {
    console.log(`Error deleting image: ${error}`);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Upload center logo
app.post("/make-server-2c29cd73/centers/upload-logo", async (c) => {
  try {
    const formData = await c.req.formData();
    const file = formData.get("file") as File;
    const centerId = formData.get("centerId") as string;

    if (!file || !centerId) {
      return c.json({ error: "File and centerId are required" }, 400);
    }

    // Ensure bucket exists
    const bucketName = "make-2c29cd73-center-logos";
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some((bucket) => bucket.name === bucketName);
    
    if (!bucketExists) {
      await supabase.storage.createBucket(bucketName, {
        public: false,
        fileSizeLimit: 5242880, // 5MB
      });
    }

    // Convert file to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    // Generate unique filename
    const timestamp = Date.now();
    const fileExt = file.name.split(".").pop();
    const fileName = `${centerId}_${timestamp}.${fileExt}`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(fileName, uint8Array, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      console.log(`Error uploading center logo: ${uploadError.message}`);
      return c.json({ error: uploadError.message }, 500);
    }

    // Get signed URL (valid for 1 year)
    const { data: urlData } = await supabase.storage
      .from(bucketName)
      .createSignedUrl(fileName, 31536000); // 365 days

    return c.json({ 
      success: true, 
      imageUrl: urlData?.signedUrl || "",
      fileName: fileName 
    });
  } catch (error) {
    console.log(`Error in upload-logo endpoint: ${error}`);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Update center profile
app.put("/make-server-2c29cd73/centers/:id", async (c) => {
  try {
    const centerId = c.req.param("id");
    const { logo, introduction } = await c.req.json();

    // Get existing center data
    const existingCenter = await kv.get(`center:profile:${centerId}`);
    
    if (!existingCenter) {
      return c.json({ error: "Center not found" }, 404);
    }

    // Update center profile
    const updatedCenter = {
      ...existingCenter,
      logo: logo || existingCenter.logo || "",
      introduction: introduction || "",
      updatedAt: new Date().toISOString(),
    };

    await kv.set(`center:profile:${centerId}`, updatedCenter);

    return c.json({ success: true, center: updatedCenter });
  } catch (error) {
    console.log(`Error updating center profile: ${error}`);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Get center profile
app.get("/make-server-2c29cd73/centers/:id", async (c) => {
  try {
    const centerId = c.req.param("id");
    const centerProfile = await kv.get(`center:profile:${centerId}`);
    
    if (!centerProfile) {
      return c.json({ error: "Center not found" }, 404);
    }

    return c.json({ center: centerProfile });
  } catch (error) {
    console.log(`Error fetching center profile: ${error}`);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Get all center products
app.get("/make-server-2c29cd73/center-products", async (c) => {
  try {
    const products = await kv.getByPrefix("center_product_");
    return c.json(products);
  } catch (error) {
    console.log(`Error fetching center products: ${error}`);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Get all coach products
app.get("/make-server-2c29cd73/coach-products", async (c) => {
  try {
    const products = await kv.getByPrefix("coach_product_");
    return c.json(products);
  } catch (error) {
    console.log(`Error fetching coach products: ${error}`);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Delete coach product
app.delete("/make-server-2c29cd73/coach-products/:id", async (c) => {
  try {
    const accessToken = c.req.header("Authorization")?.split(" ")[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user?.id) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const productId = c.req.param("id");
    await kv.del(productId);
    
    return c.json({ success: true });
  } catch (error) {
    console.log(`Error deleting coach product: ${error}`);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Create coach product
app.post("/make-server-2c29cd73/coach-products", async (c) => {
  try {
    const accessToken = c.req.header("Authorization")?.split(" ")[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user?.id) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const { productName, price, sessions, description, imageUrl } = await c.req.json();

    if (!productName || !price || !sessions) {
      return c.json({ error: "Product name, price, and sessions are required" }, 400);
    }

    // Get coach info
    const coachProfile = await kv.get(`coach:profile:${user.id}`);
    const coachName = coachProfile?.name || user.user_metadata?.name || "코치";

    const productId = `coach_product_${user.id}_${Date.now()}`;
    const product = {
      id: productId,
      coachId: user.id,
      coachName,
      productName,
      price: Number(price),
      sessions: Number(sessions),
      description: description || "",
      imageUrl: imageUrl || "",
      createdAt: new Date().toISOString(),
    };

    await kv.set(productId, product);
    return c.json({ success: true, product });
  } catch (error) {
    console.log(`Error creating coach product: ${error}`);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Purchase center membership
app.post("/make-server-2c29cd73/purchase-center-membership", async (c) => {
  try {
    const accessToken = c.req.header("Authorization")?.split(" ")[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user?.id) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const { productId, centerName, membershipName, duration, price, centerId } = await c.req.json();

    if (!productId || !centerName || !membershipName || !duration || !price) {
      return c.json({ error: "All fields are required" }, 400);
    }

    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + duration);

    const purchaseId = `center_membership_${user.id}_${Date.now()}`;
    const purchase = {
      id: purchaseId,
      userId: user.id,
      productId,
      centerId,
      centerName,
      membershipName,
      duration,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      price: Number(price),
      note: "",
      purchaseDate: new Date().toISOString(),
    };

    await kv.set(purchaseId, purchase);

    // Record sale for center (센터 매출 기록)
    if (centerId) {
      const saleId = `center_sale_${centerId}_${Date.now()}`;
      const sale = {
        id: saleId,
        centerId,
        userId: user.id,
        userName: user.user_metadata?.name || "회원",
        productType: "center_membership",
        productName: membershipName,
        amount: Number(price),
        saleDate: new Date().toISOString(),
        refunded: false,
      };
      await kv.set(saleId, sale);
    }

    return c.json({ success: true, purchase });
  } catch (error) {
    console.log(`Error purchasing center membership: ${error}`);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Get my center memberships
app.get("/make-server-2c29cd73/my-center-memberships", async (c) => {
  try {
    const accessToken = c.req.header("Authorization")?.split(" ")[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user?.id) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const memberships = await kv.getByPrefix(`center_membership_${user.id}_`);
    return c.json({ memberships });
  } catch (error) {
    console.log(`Error fetching center memberships: ${error}`);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Purchase PT membership
app.post("/make-server-2c29cd73/purchase-pt-membership", async (c) => {
  try {
    const accessToken = c.req.header("Authorization")?.split(" ")[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user?.id) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const { productId, coachId, coachName, productName, sessions, price, centerId } = await c.req.json();

    if (!productId || !coachId || !coachName || !productName || !sessions || !price) {
      return c.json({ error: "All fields are required" }, 400);
    }

    const purchaseId = `pt_membership_${user.id}_${Date.now()}`;
    const purchase = {
      id: purchaseId,
      userId: user.id,
      productId,
      coachId,
      coachName,
      productName,
      totalSessions: Number(sessions),
      remainingSessions: Number(sessions),
      price: Number(price),
      note: "",
      purchaseDate: new Date().toISOString(),
    };

    await kv.set(purchaseId, purchase);

    // Record sale for coach (코치 매출 기록)
    const coachSaleId = `coach_sale_${coachId}_${Date.now()}`;
    const coachSale = {
      id: coachSaleId,
      coachId,
      userId: user.id,
      userName: user.user_metadata?.name || "회원",
      productType: "pt_membership",
      productName,
      amount: Number(price),
      sessions: Number(sessions),
      saleDate: new Date().toISOString(),
      refunded: false,
    };
    await kv.set(coachSaleId, coachSale);

    // Record sale for center if centerId is provided (센터 매출 기록)
    if (centerId) {
      const centerSaleId = `center_sale_${centerId}_${Date.now()}`;
      const centerSale = {
        id: centerSaleId,
        centerId,
        coachId,
        userId: user.id,
        userName: user.user_metadata?.name || "회원",
        productType: "pt_membership",
        productName,
        amount: Number(price),
        saleDate: new Date().toISOString(),
        refunded: false,
      };
      await kv.set(centerSaleId, centerSale);
    }

    return c.json({ success: true, purchase });
  } catch (error) {
    console.log(`Error purchasing PT membership: ${error}`);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Get my PT memberships
app.get("/make-server-2c29cd73/my-pt-memberships", async (c) => {
  try {
    const accessToken = c.req.header("Authorization")?.split(" ")[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user?.id) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const memberships = await kv.getByPrefix(`pt_membership_${user.id}_`);
    return c.json({ memberships });
  } catch (error) {
    console.log(`Error fetching PT memberships: ${error}`);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Create PT feedback (by coach)
app.post("/make-server-2c29cd73/pt-feedbacks", async (c) => {
  try {
    const accessToken = c.req.header("Authorization")?.split(" ")[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user?.id) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const { ptMembershipId, sessionNumber, feedback } = await c.req.json();

    if (!ptMembershipId || !sessionNumber || !feedback) {
      return c.json({ error: "All fields are required" }, 400);
    }

    const coachName = user.user_metadata?.name || "코치";

    const feedbackId = `pt_feedback_${ptMembershipId}_${sessionNumber}_${Date.now()}`;
    const feedbackData = {
      id: feedbackId,
      ptMembershipId,
      sessionNumber: Number(sessionNumber),
      feedback,
      coachName,
      createdAt: new Date().toISOString(),
    };

    await kv.set(feedbackId, feedbackData);
    return c.json({ success: true, feedback: feedbackData });
  } catch (error) {
    console.log(`Error creating PT feedback: ${error}`);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Get PT feedbacks for a membership
app.get("/make-server-2c29cd73/pt-feedbacks/:membershipId", async (c) => {
  try {
    const accessToken = c.req.header("Authorization")?.split(" ")[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user?.id) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const membershipId = c.req.param("membershipId");
    const feedbacks = await kv.getByPrefix(`pt_feedback_${membershipId}_`);
    
    // Sort by session number
    const sortedFeedbacks = feedbacks.sort((a: any, b: any) => {
      const aData = a.value || a;
      const bData = b.value || b;
      return aData.sessionNumber - bData.sessionNumber;
    });

    return c.json({ feedbacks: sortedFeedbacks });
  } catch (error) {
    console.log(`Error fetching PT feedbacks: ${error}`);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Get/Create coach profile
app.get("/make-server-2c29cd73/coach-profile", async (c) => {
  try {
    const accessToken = c.req.header("Authorization")?.split(" ")[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user?.id) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const profile = await kv.get(`coach:profile:${user.id}`);
    return c.json({ profile });
  } catch (error) {
    console.log(`Error fetching coach profile: ${error}`);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Save coach profile
app.post("/make-server-2c29cd73/coach-profile", async (c) => {
  try {
    const accessToken = c.req.header("Authorization")?.split(" ")[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user?.id) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const { name, certification, specialty, careerHistory, message, profileImage, gender, location } = await c.req.json();

    const profile = {
      id: user.id,
      email: user.email,
      name: name || "",
      certification: certification || "",
      specialty: specialty || "",
      careerHistory: careerHistory || "",
      message: message || "",
      profileImage: profileImage || "",
      gender: gender || "",
      location: location || "",
      updatedAt: new Date().toISOString(),
    };

    await kv.set(`coach:profile:${user.id}`, profile);
    return c.json({ success: true, profile });
  } catch (error) {
    console.log(`Error saving coach profile: ${error}`);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Get coach stats
app.get("/make-server-2c29cd73/coach-stats", async (c) => {
  try {
    const accessToken = c.req.header("Authorization")?.split(" ")[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user?.id) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    // Get all PT memberships for this coach
    const allMemberships = await kv.getByPrefix("pt_membership_");
    const coachMemberships = allMemberships.filter((m: any) => {
      const membership = m.value || m;
      return membership.coachId === user.id;
    });

    // Calculate stats
    const currentMembers = new Set(coachMemberships.map((m: any) => (m.value || m).userId)).size;
    const remainingSessions = coachMemberships.reduce((sum: number, m: any) => {
      const membership = m.value || m;
      return sum + (membership.remainingSessions || 0);
    }, 0);

    // Monthly stats (current month)
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthlyMemberships = coachMemberships.filter((m: any) => {
      const membership = m.value || m;
      return new Date(membership.purchaseDate) >= monthStart;
    });

    const monthlyRevenue = monthlyMemberships.reduce((sum: number, m: any) => {
      const membership = m.value || m;
      return sum + (membership.price || 0);
    }, 0);

    const stats = {
      currentMembers,
      remainingSessions,
      monthlyRevenue,
      monthlySalary: monthlyRevenue * 0.7, // 70% commission
      monthlyTotalClasses: 0, // TODO: implement
      monthlyRefunds: 0, // TODO: implement
      monthlyExpiring: 0, // TODO: implement
    };

    return c.json({ stats });
  } catch (error) {
    console.log(`Error fetching coach stats: ${error}`);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Get coach members
app.get("/make-server-2c29cd73/coach-members", async (c) => {
  try {
    const accessToken = c.req.header("Authorization")?.split(" ")[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user?.id) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    // Get all PT memberships for this coach
    const allMemberships = await kv.getByPrefix("pt_membership_");
    const coachMemberships = allMemberships
      .filter((m: any) => {
        const membership = m.value || m;
        return membership.coachId === user.id;
      })
      .map((m: any) => {
        const membership = m.value || m;
        return {
          id: membership.id,
          userId: membership.userId,
          userName: "", // TODO: fetch from user profile
          userEmail: "", // TODO: fetch from user profile
          totalSessions: membership.totalSessions,
          remainingSessions: membership.remainingSessions,
          purchaseDate: membership.purchaseDate,
        };
      });

    return c.json({ members: coachMemberships });
  } catch (error) {
    console.log(`Error fetching coach members: ${error}`);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Get my coach products
app.get("/make-server-2c29cd73/my-coach-products", async (c) => {
  try {
    const accessToken = c.req.header("Authorization")?.split(" ")[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user?.id) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const allProducts = await kv.getByPrefix("coach_product_");
    const myProducts = allProducts
      .filter((p: any) => {
        const product = p.value || p;
        const coachId = product.id?.split("_")[2];
        return coachId === user.id;
      })
      .map((p: any) => p.value || p);

    return c.json({ products: myProducts });
  } catch (error) {
    console.log(`Error fetching my coach products: ${error}`);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Save coach feedback
app.post("/make-server-2c29cd73/coach-feedback", async (c) => {
  try {
    const accessToken = c.req.header("Authorization")?.split(" ")[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user?.id) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const { userId, sessionNumber, feedback, weekId } = await c.req.json();

    if (!userId || !sessionNumber || !feedback || !weekId) {
      return c.json({ error: "All fields are required" }, 400);
    }

    const coachName = user.user_metadata?.name || "코치";

    const feedbackId = `coach_feedback_${userId}_${weekId}_${Date.now()}`;
    const feedbackData = {
      id: feedbackId,
      userId,
      coachId: user.id,
      coachName,
      sessionNumber: Number(sessionNumber),
      feedback,
      weekId,
      createdAt: new Date().toISOString(),
    };

    await kv.set(feedbackId, feedbackData);
    return c.json({ success: true, feedback: feedbackData });
  } catch (error) {
    console.log(`Error saving coach feedback: ${error}`);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Save coach program
app.post("/make-server-2c29cd73/coach-program", async (c) => {
  try {
    const accessToken = c.req.header("Authorization")?.split(" ")[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user?.id) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const { userId, weekId, program } = await c.req.json();

    if (!userId || !weekId || !program) {
      return c.json({ error: "All fields are required" }, 400);
    }

    const programId = `coach_program_${userId}_${weekId}_${Date.now()}`;
    const programData = {
      id: programId,
      userId,
      coachId: user.id,
      weekId,
      program,
      createdAt: new Date().toISOString(),
    };

    await kv.set(programId, programData);
    return c.json({ success: true, program: programData });
  } catch (error) {
    console.log(`Error saving coach program: ${error}`);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Save PT journal
app.post("/make-server-2c29cd73/pt-journal", async (c) => {
  try {
    const accessToken = c.req.header("Authorization")?.split(" ")[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user?.id) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const { userId, date, journal } = await c.req.json();

    if (!userId || !date || !journal) {
      return c.json({ error: "All fields are required" }, 400);
    }

    const journalId = `pt_journal_${userId}_${date}_${Date.now()}`;
    const journalData = {
      id: journalId,
      userId,
      coachId: user.id,
      date,
      journal,
      createdAt: new Date().toISOString(),
    };

    await kv.set(journalId, journalData);
    return c.json({ success: true, journal: journalData });
  } catch (error) {
    console.log(`Error saving PT journal: ${error}`);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Get member inbody data (for coach)
app.get("/make-server-2c29cd73/member-inbody/:userId", async (c) => {
  try {
    const accessToken = c.req.header("Authorization")?.split(" ")[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user?.id) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const userId = c.req.param("userId");
    const measurements = await kv.getByPrefix(`inbody_${userId}_`);
    
    return c.json({ measurements: measurements.map((m: any) => m.value || m) });
  } catch (error) {
    console.log(`Error fetching member inbody: ${error}`);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Get member feedbacks (for coach)
app.get("/make-server-2c29cd73/member-feedbacks/:userId", async (c) => {
  try {
    const accessToken = c.req.header("Authorization")?.split(" ")[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user?.id) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const userId = c.req.param("userId");
    const feedbacks = await kv.getByPrefix(`coach_feedback_${userId}_`);
    
    return c.json({ feedbacks: feedbacks.map((f: any) => f.value || f) });
  } catch (error) {
    console.log(`Error fetching member feedbacks: ${error}`);
    return c.json({ error: "Internal server error" }, 500);
  }
});

Deno.serve(app.fetch);