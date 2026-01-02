import { updateContext } from "../conversation.state";

type UpcomingAppointment = {
  id: string;
  appointmentDate: string;
  service: { canonicalName: string };
};

export async function handleModifyAppointmentFlow(
  senderId: string,
  text: string,
  context: any,
  SERVICE_API_BASE_URL: string
) {

  if (context.modifyFlow?.step === "ASK_WHICH_APPOINTMENT") {
    const normalizedText = text.trim();
    let appointment: UpcomingAppointment | undefined;

    // محاولة الاختيار بالرقم
    const index = parseInt(normalizedText, 10) - 1;
    if (!isNaN(index)) {
      appointment = context.appointments?.[index];
    }

    // إذا مش رقم  محاولة مطابقة اسم الخدمة
    if (!appointment) {
      appointment = context.appointments?.find((a: UpcomingAppointment) =>
        a.service.canonicalName.includes(normalizedText) ||
        normalizedText.includes(a.service.canonicalName)
      );
    }

    if (!appointment) {
      const message =
        "ما قدرت أحدد أي موعد. احكيلي رقم الموعد من القائمة.";
      updateContext(senderId, { lastBotMessage: message });
      return {
        handled: true,
        response: { ok: true, stage: "DATE", message },
      };
    }

    updateContext(senderId, {
      modifyFlow: {
        step: "WAITING_NEW_DATE",
        appointmentId: appointment.id,
      },
      appointments: undefined,
      stage: "DATE",
    });

    const message = "تمام. احكيلي التاريخ الجديد.";
    updateContext(senderId, { lastBotMessage: message });

    return { handled: true, response: { ok: true, stage: "DATE", message } };
  }

  if (context.modifyFlow?.step === "WAITING_NEW_DATE") {
    const match = text.match(/(\d{1,2})[\/\-](\d{1,2})/);

    if (!match) {
      const message = "مش واضح التاريخ. احكيلي اليوم والشهر، مثلاً: 28/12";
      updateContext(senderId, { lastBotMessage: message });
      return { handled: true, response: { ok: true, stage: "DATE", message } };
    }

    const day = parseInt(match[1], 10);
    const month = parseInt(match[2], 10) - 1;

    const now = new Date();
    let year = now.getFullYear();
    const candidate = new Date(year, month, day);

    if (candidate < now) year++;

    const dateOnly = new Date(year, month, day);

    updateContext(senderId, {
      modifyFlow: {
        step: "WAITING_NEW_TIME",
        appointmentId: context.modifyFlow.appointmentId,
        newDateOnly: dateOnly,
      },
      stage: "TIME",
    });

    const message = "تمام. احكيلي الساعة الجديدة.";
    updateContext(senderId, { lastBotMessage: message });

    return { handled: true, response: { ok: true, stage: "TIME", message } };
  }

  if (context.modifyFlow?.step === "WAITING_NEW_TIME") {
    const match = text.match(/(\d{1,2})(?::(\d{2}))?/);

    if (!match) {
      const message = "مش واضحة الساعة. احكيلي الساعة مثل: 11:30";
      updateContext(senderId, { lastBotMessage: message });
      return { handled: true, response: { ok: true, stage: "TIME", message } };
    }

    let hour = parseInt(match[1], 10);
    const minute = match[2] ? parseInt(match[2], 10) : 0;

    if (hour >= 1 && hour <= 7) {
      hour += 12;
    }

    if (hour > 23 || minute > 59) {
      const message = "الساعة غير صحيحة. جرب مرة ثانية.";
      updateContext(senderId, { lastBotMessage: message });
      return { handled: true, response: { ok: true, stage: "TIME", message } };
    }

    const finalDate = new Date(context.modifyFlow.newDateOnly);
    finalDate.setHours(hour, minute, 0, 0);

    const pad = (n: number) => n.toString().padStart(2, "0");

    const localDateTime = `${finalDate.getFullYear()}-${pad(
      finalDate.getMonth() + 1
    )}-${pad(finalDate.getDate())}T${pad(finalDate.getHours())}:${pad(
      finalDate.getMinutes()
    )}:00.000Z`;
    console.log("Modifying appointment to new date:", localDateTime);

    const patchRes = await fetch(
      `${SERVICE_API_BASE_URL}/appointments/${context.modifyFlow.appointmentId}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${context.authToken}`,
        },
        body: JSON.stringify({
          date: localDateTime,
        }),
      }
    );

    if (!patchRes.ok) {
      const message = "صار في مشكلة بتعديل الموعد. جرب لاحقًا.";
      updateContext(senderId, { lastBotMessage: message });
      return { handled: true, response: { ok: true, stage: "SERVICE", message } };
    }

    updateContext(senderId, {
      modifyFlow: undefined,
      stage: "SERVICE",
    });

    const message = `تم تعديل الموعد بنجاح.
الموعد الجديد بتاريخ ${finalDate.toLocaleDateString("ar-EG")} الساعة ${finalDate.toLocaleTimeString(
      "ar-EG",
      { hour: "2-digit", minute: "2-digit" }
    )}`;

    updateContext(senderId, { lastBotMessage: message });

    return { handled: true, response: { ok: true, stage: "SERVICE", message } };
  }

  return { handled: false as const };
}

//  Entry point for MODIFY_APPOINTMENT
export async function startModifyAppointment(
  senderId: string,
  context: any,
  SERVICE_API_BASE_URL: string
) {
  if (!context.authToken) {
    updateContext(senderId, {
      stage: "IDENTITY",
      afterIdentity: "MODIFY_APPOINTMENT",
    });

    const message = "عشان نعدّل موعدك، بدنا نتحقق من هويتك. احكيلي رقم هويتك.";
    updateContext(senderId, { lastBotMessage: message });

    return { ok: true, stage: "IDENTITY", message };
  }

  const resAppointments = await fetch(
    `${SERVICE_API_BASE_URL}/appointments/upcoming`,
    {
      headers: { Authorization: `Bearer ${context.authToken}` },
    }
  );

  const data = await resAppointments.json();
  if (!data.upcoming?.length) {
    const message = "ما عندك أي مواعيد قادمة.";
    updateContext(senderId, { lastBotMessage: message });
    return { ok: true, stage: "SERVICE", message };
  }

  const upcoming = data.upcoming as UpcomingAppointment[];

  if (upcoming.length === 1) {
    const appointment = upcoming[0];

    updateContext(senderId, {
      modifyFlow: {
        step: "WAITING_NEW_DATE",
        appointmentId: appointment.id,
      },
      stage: "DATE",
    });

    const message = `تمام. موعدك لخدمة "${appointment.service.canonicalName}" بتاريخ ${new Date(
      appointment.appointmentDate
    ).toLocaleDateString("ar-EG")}.\nاحكيلي التاريخ الجديد.`;

    updateContext(senderId, { lastBotMessage: message });

    return { ok: true, stage: "DATE", message };
  }

  // أكثر من موعد
  updateContext(senderId, {
    modifyFlow: { step: "ASK_WHICH_APPOINTMENT" },
    appointments: upcoming,
    stage: "DATE",
  });

  const message = `أي موعد بدك تعدله؟
احكيلي رقم الموعد من القائمة:

${upcoming
      .map(
        (a, i) =>
          `${i + 1}. ${a.service.canonicalName} بتاريخ ${new Date(
            a.appointmentDate
          ).toLocaleDateString("ar-EG")}`
      )
      .join("\n")}`;

  updateContext(senderId, { lastBotMessage: message });

  return { ok: true, stage: "DATE", message };
}
