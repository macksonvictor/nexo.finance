import barChartClean from "@/assets/lottie/bar-chart-clean.json";
import boxOpen from "@/assets/lottie/box-open.json";
import clock from "@/assets/lottie/clock.json";
import dashboard from "@/assets/lottie/dashboard.json";
import notificationBellBlack from "@/assets/lottie/notification-bell-black.json";
import notificationBellWhite from "@/assets/lottie/notification-bell-white.json";
import pulseHeart from "@/assets/lottie/pulse-heart.json";
import settings from "@/assets/lottie/settings.json";
import targetGoal from "@/assets/lottie/target-goal.json";

export const lottieAnimations = {
  barChartClean,
  boxOpen,
  clock,
  dashboard,
  notificationBellBlack,
  notificationBellWhite,
  pulseHeart,
  settings,
  targetGoal,
} as const;

export type NexoLottieAnimation = (typeof lottieAnimations)[keyof typeof lottieAnimations];
