Public Sub Test(C As Integer = 0, D As String)
  Private A%, B%
  If C < 0 Then Exit Sub Else C = A * B
End Sub

Public Sub F(C As Integer = 0, ByVal ParamArray D() As Double)
  Private A%, B%
End Sub

Test 3, D:="Test" & F(0, 1, 2, 3) & "Test"
F(0, 1, 2, 3)
F(0, 1, 2, 3, C:=4)